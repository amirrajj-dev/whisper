import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from 'src/common/dtos/auth/signup.dto';
import { LoginDto } from 'src/common/dtos/auth/login.dto';
import { Request, Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/common/types/user.type';
import { JwtAuthGuard } from './jwt-auth.gurad';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_EXPIRY,
} from 'src/common/constants/auth.constants';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { RestrictEmailDomainPipe } from 'src/common/pipes/restrict-email-domain.pipe';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('register')
  async register(
    @Body() signupDto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signup(signupDto);
    const nodeEnv = this.configService.get<
      'development' | 'production' | 'test'
    >('NODE_ENV');
    res.cookie(ACCESS_TOKEN_COOKIE, result.access_token, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: ACCESS_TOKEN_EXPIRY,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, result.refresh_token, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY,
    });
    return result;
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(RestrictEmailDomainPipe) loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    const nodeEnv = this.configService.get<
      'development' | 'production' | 'test'
    >('NODE_ENV');
    res.cookie(ACCESS_TOKEN_COOKIE, result.access_token, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: ACCESS_TOKEN_EXPIRY, // 15 minutes
    });
    res.cookie(REFRESH_TOKEN_COOKIE, result.refresh_token, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY, // 30 days
    });
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body('refresh_token') bodyToken: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      bodyToken ||
      (req.cookies as { whisper_refresh_token?: string })
        ?.whisper_refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    const result = await this.authService.refreshTokens(refreshToken);
    const nodeEnv = this.configService.get<
      'development' | 'production' | 'test'
    >('NODE_ENV');

    res.cookie(ACCESS_TOKEN_COOKIE, result.access_token, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: ACCESS_TOKEN_EXPIRY,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, result.refresh_token, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY,
    });
    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: Omit<User, 'password'>,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user._id);
    res.clearCookie(ACCESS_TOKEN_COOKIE);
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: Omit<User, 'password'>) {
    return user;
  }
}
