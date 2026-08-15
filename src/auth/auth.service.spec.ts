import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserPreferencesService } from '../user-preferences/user-preferences.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

jest.mock('bcrypt');

const mockRefreshTokenRecord = (
  overrides: Partial<RefreshToken> = {},
): RefreshToken => ({
  id: 'refresh-id-1',
  userId: 'uuid-1',
  tokenHash: 'hashed-token',
  expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  revokedAt: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: undefined,
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let userPreferencesService: jest.Mocked<UserPreferencesService>;
  let refreshTokenRepository: jest.Mocked<
    Pick<Repository<RefreshToken>, 'findOne' | 'save' | 'create' | 'update'>
  >;

  const mockUser: User = {
    id: 'uuid-1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword123',
    role: UserRole.TECHNICIAN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  };

  const preferences = {
    userId: 'uuid-1',
    theme: 'light',
    language: 'es',
    preferences: {},
  };

  beforeEach(async () => {
    refreshTokenRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: UserPreferencesService,
          useValue: {
            getByUserId: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockImplementation((key: string, def: unknown) => def),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    userPreferencesService = module.get(UserPreferencesService);
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'john@example.com',
        'password123',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword123',
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('unknown@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.validateUser('john@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('john@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'john@example.com', password: 'password123' };

    it('should return access token and refresh token on successful login', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');
      (userPreferencesService.getByUserId as jest.Mock).mockResolvedValue(
        preferences,
      );
      refreshTokenRepository.create.mockReturnValue(mockRefreshTokenRecord());
      refreshTokenRepository.save.mockResolvedValue(mockRefreshTokenRecord());

      const result = await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        role: mockUser.role,
      });
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      );
      expect(refreshTokenRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'jwt-token',
        refreshToken: expect.any(String),
        user: {
          id: 'uuid-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'technician',
        },
        preferences: {
          theme: 'light',
          language: 'es',
        },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should rotate the refresh token and return a new session', async () => {
      const activeRecord = mockRefreshTokenRecord();
      refreshTokenRepository.findOne.mockResolvedValue(activeRecord);
      usersService.findOne.mockResolvedValue(mockUser);
      (userPreferencesService.getByUserId as jest.Mock).mockResolvedValue(
        preferences,
      );
      jwtService.sign.mockReturnValue('jwt-token');
      refreshTokenRepository.create.mockReturnValue(mockRefreshTokenRecord());
      refreshTokenRepository.save.mockResolvedValue(mockRefreshTokenRecord());

      const result = await service.refresh('raw-refresh-token');

      expect(refreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: { tokenHash: expect.any(String) },
      });
      // El token usado queda revocado (rotación)
      expect(activeRecord.revokedAt).toBeInstanceOf(Date);
      expect(refreshTokenRepository.save).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        role: mockUser.role,
      });
      expect(result).toEqual(
        expect.objectContaining({
          accessToken: 'jwt-token',
          refreshToken: expect.any(String),
          user: expect.objectContaining({ id: 'uuid-1' }),
        }),
      );
    });

    it('should throw UnauthorizedException if token does not exist', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.refresh('unknown-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token was already revoked (rotation replay)', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(
        mockRefreshTokenRecord({ revokedAt: new Date() }),
      );

      await expect(service.refresh('replayed-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(
        mockRefreshTokenRecord({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if the user no longer exists', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(
        mockRefreshTokenRecord(),
      );
      usersService.findOne.mockRejectedValue(new Error('not found'));

      await expect(service.refresh('orphan-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if the user is disabled', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(
        mockRefreshTokenRecord(),
      );
      usersService.findOne.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.refresh('disabled-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke all active refresh tokens for the user', async () => {
      refreshTokenRepository.update.mockResolvedValue({ affected: 2 } as never);

      await service.logout('uuid-1');

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: 'uuid-1', revokedAt: expect.anything() },
        { revokedAt: expect.any(Date) },
      );
    });
  });

  describe('register', () => {
    const createUserDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: UserRole.TECHNICIAN,
    };

    it('should register a new user successfully', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register(createUserDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });
});
