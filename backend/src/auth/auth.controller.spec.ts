import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockResponse = () => {
    const res: any = {};
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('development');

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should signup user and set cookies', async () => {
      const res = mockResponse();
      const signupDto = {
        email: 'test@example.com',
        password: 'TestPass123!',
        username: 'testuser',
      };
      const authResult = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: {
          id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
        },
      };
      mockAuthService.signup.mockResolvedValue(authResult as any);

      const result = await controller.register(signupDto, res);

      expect(result).toBe(authResult);
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
    });
  });

  describe('login', () => {
    it('should login user and set cookies', async () => {
      const res = mockResponse();
      const loginDto = { email: 'test@example.com', password: 'TestPass123!' };
      const authResult = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: {
          id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
        },
      };
      mockAuthService.login.mockResolvedValue(authResult as any);

      const result = await controller.login(loginDto, res);

      expect(result).toBe(authResult);
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens using body token', async () => {
      const res = mockResponse();
      const req = { cookies: {} } as any;
      const tokenResult = {
        access_token: 'new-access',
        refresh_token: 'new-refresh',
      };
      mockAuthService.refreshTokens.mockResolvedValue(tokenResult as any);

      const result = await controller.refresh('refresh-token', req, res);

      expect(result).toBe(tokenResult);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        'refresh-token',
      );
    });

    it('should refresh tokens using cookie when no body token', async () => {
      const res = mockResponse();
      const req = {
        cookies: { whisper_refresh_token: 'cookie-token' },
      } as any;
      const tokenResult = {
        access_token: 'new-access',
        refresh_token: 'new-refresh',
      };
      mockAuthService.refreshTokens.mockResolvedValue(tokenResult as any);

      const result = await controller.refresh(undefined as any, req, res);

      expect(result).toBe(tokenResult);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        'cookie-token',
      );
    });

    it('should throw when no refresh token provided', async () => {
      const res = mockResponse();
      const req = { cookies: {} } as any;

      await expect(
        controller.refresh(undefined as any, req, res),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout user and clear cookies', async () => {
      const res = mockResponse();
      mockAuthService.logout.mockResolvedValue(true);

      const result = await controller.logout(mockUser as any, res);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockAuthService.logout).toHaveBeenCalledWith('user123');
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMe', () => {
    it('should return the current user', () => {
      const result = controller.getMe(mockUser as any);

      expect(result).toBe(mockUser);
    });
  });
});
