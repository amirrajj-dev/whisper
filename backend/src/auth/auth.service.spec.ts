import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let userService: jest.Mocked<UserService>;
  let refreshTokenModel: any;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUserService = {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    isUsernameTaken: jest.fn(),
    createUser: jest.fn(),
  };

  const mockRefreshTokenModel = Object.assign(
    jest.fn((data?: any) => ({
      save: jest.fn().mockResolvedValue(undefined),
      ...data,
      expiresAt: data?.expiresAt || new Date(Date.now() + 86400000),
    })),
    {
      find: jest.fn(),
      findOne: jest.fn(),
      deleteMany: jest.fn(),
      deleteOne: jest.fn(),
    },
  );

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        BCRYPT_SALT_ROUNDS: '10',
        JWT_SECRET: 'test-secret',
        ACCESS_TOKEN_EXPIRES_IN: '15m',
        REFRESH_TOKEN_EXPIRES_IN: '30d',
      };
      return config[key] ?? null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UserService, useValue: mockUserService },
        {
          provide: getModelToken('RefreshToken'),
          useValue: mockRefreshTokenModel,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    userService = module.get(UserService);
    refreshTokenModel = module.get(getModelToken('RefreshToken'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    const signupDto = {
      email: 'test@example.com',
      password: 'TestPass123!',
      username: 'testuser',
    };

    it('should create a user and return tokens', async () => {
      mockUserService.findUserByEmail.mockResolvedValue(null);
      mockUserService.isUsernameTaken.mockResolvedValue(false);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      const newUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: new Date(),
      };
      mockUserService.createUser.mockResolvedValue(newUser as any);

      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.signup(signupDto);

      expect(mockUserService.findUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockUserService.isUsernameTaken).toHaveBeenCalledWith('testuser');
      expect(mockUserService.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashed-password',
        username: 'testuser',
      });
      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: {
          id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: expect.any(Date),
        },
      });
    });

    it('should throw BadRequestException when email already exists', async () => {
      mockUserService.findUserByEmail.mockResolvedValue({
        _id: 'existing',
      } as any);

      await expect(service.signup(signupDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotAcceptableException when username taken', async () => {
      mockUserService.findUserByEmail.mockResolvedValue(null);
      mockUserService.isUsernameTaken.mockResolvedValue(true);

      await expect(service.signup(signupDto)).rejects.toThrow(
        NotAcceptableException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'TestPass123!',
    };

    it('should return tokens for valid credentials', async () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed-password',
        avatarUrl: '',
        bio: '',
        createdAt: new Date(),
        toString: () => 'user123',
      };
      mockUserService.findUserByEmail.mockResolvedValue(user as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      mockRefreshTokenModel.deleteMany.mockResolvedValue({ deletedCount: 1 });

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: {
          id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
          avatarUrl: '',
          bio: '',
          createdAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserService.findUserByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid password', async () => {
      mockUserService.findUserByEmail.mockResolvedValue({
        password: 'hash',
      } as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens for a valid refresh token', async () => {
      const payload = {
        sub: 'user123',
        email: 'test@example.com',
        username: 'testuser',
      };
      mockJwtService.verify.mockReturnValue(payload);

      const storedToken = {
        _id: 'token1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 86400000),
      };
      mockRefreshTokenModel.find.mockResolvedValue([storedToken]);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      mockRefreshTokenModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
      mockJwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user123' });
      mockRefreshTokenModel.find.mockResolvedValue([]);

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when verification fails', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await expect(service.refreshTokens('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should delete refresh tokens and return true', async () => {
      mockRefreshTokenModel.deleteMany.mockResolvedValue({ deletedCount: 1 });

      const result = await service.logout('user123');

      expect(result).toBe(true);
      expect(mockRefreshTokenModel.deleteMany).toHaveBeenCalledWith({
        userId: 'user123',
      });
    });
  });

  describe('validateUser', () => {
    it('should return user for valid payload', async () => {
      const user = { _id: 'user123', email: 'test@example.com' };
      mockUserService.findUserById.mockResolvedValue(user as any);

      const result = await service.validateUser({
        sub: 'user123',
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(result).toBe(user);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserService.findUserById.mockResolvedValue(null);

      await expect(
        service.validateUser({
          sub: 'user123',
          email: 'test@example.com',
          username: 'testuser',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findRefreshToken / saveRefreshToken / deleteOldRefreshToken', () => {
    it('findRefreshToken should call findOne', async () => {
      mockRefreshTokenModel.findOne.mockResolvedValue({ tokenHash: 'hash' });

      const result = await service.findRefreshToken('user123');

      expect(mockRefreshTokenModel.findOne).toHaveBeenCalledWith({
        userId: 'user123',
      });
      expect(result).toEqual({ tokenHash: 'hash' });
    });

    it('deleteOldRefreshToken should call deleteMany', async () => {
      mockRefreshTokenModel.deleteMany.mockResolvedValue({ deletedCount: 2 });

      await service.deleteOldRefreshToken('user123');

      expect(mockRefreshTokenModel.deleteMany).toHaveBeenCalledWith({
        userId: 'user123',
      });
    });

    it('saveRefreshToken should create and save a token', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-token' as never);

      await service.saveRefreshToken('user123', 'raw-token');

      expect(mockRefreshTokenModel).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          tokenHash: 'hashed-token',
          expiresAt: expect.any(Date),
        }),
      );
      const instance = mockRefreshTokenModel.mock.results[0].value;
      expect(instance.save).toHaveBeenCalled();
      expect(instance.userId).toBe('user123');
    });
  });
});
