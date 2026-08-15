import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { UserPreferencesService } from '../user-preferences/user-preferences.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './strategies/jwt-payload.interface';

const DEFAULT_REFRESH_TTL_DAYS = 14;
const REFRESH_TOKEN_BYTES = 48;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly userPreferencesService: UserPreferencesService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
    };

    const preferences = await this.userPreferencesService.getByUserId(user.id);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      preferences: {
        theme: preferences.theme,
        language: preferences.language,
        ...(preferences.preferences || {}),
      },
    };
  }

  async refresh(refreshToken: string) {
    const record = await this.refreshTokenRepository.findOne({
      where: { tokenHash: this.hashToken(refreshToken) },
    });

    if (!record || record.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    let user: User;
    try {
      user = await this.usersService.findOne(record.userId);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Rotación: se revoca el token usado y se emite uno nuevo.
    record.revokedAt = new Date();
    await this.refreshTokenRepository.save(record);

    return this.buildSession(user);
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async register(createUserDto: CreateUserDto) {
    const existing = await this.usersService.findByEmail(createUserDto.email);

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    return this.usersService.create(createUserDto);
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    return this.usersService.update(userId, updateProfileDto);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findByEmail(
      (await this.usersService.findOne(userId)).email,
    );

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    return this.usersService.update(userId, {
      password: changePasswordDto.newPassword,
    });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const raw = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    const ttlDays = parseInt(
      this.configService.get<string>(
        'JWT_REFRESH_TTL_DAYS',
        `${DEFAULT_REFRESH_TTL_DAYS}`,
      ),
      10,
    );
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId,
        tokenHash: this.hashToken(raw),
        expiresAt,
      }),
    );

    return raw;
  }

  private async buildSession(user: User) {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const preferences = await this.userPreferencesService.getByUserId(user.id);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      preferences: {
        theme: preferences.theme,
        language: preferences.language,
        ...(preferences.preferences || {}),
      },
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
