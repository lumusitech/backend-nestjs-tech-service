import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserPreferencesService } from '../user-preferences/user-preferences.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let userPreferencesService: jest.Mocked<UserPreferencesService>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    userPreferencesService = module.get(UserPreferencesService);
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
    const loginDto = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should return an access token on successful login', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');
      (userPreferencesService.getByUserId as jest.Mock).mockResolvedValue({
        userId: 'uuid-1',
        theme: 'light',
        language: 'es',
        preferences: {},
      });

      const result = await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        role: mockUser.role,
      });
      expect(result).toEqual({
        accessToken: 'jwt-token',
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
