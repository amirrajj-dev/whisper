import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from 'src/common/dtos/auth/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from 'src/user/user.service';
import { JwtPayload } from 'src/common/interfaces/auth/auth-payload.interface';
import { AuthReturnType } from 'src/common/interfaces/auth/auth-return-type.interface';
import { LoginDto } from 'src/common/dtos/auth/login.dto';
import { RefreshTokenDocument } from 'src/common/schemas/refresh-token.schema';
import { User } from 'src/common/types/user.type';
import { REFRESH_TOKEN_EXPIRY } from 'src/common/constants/constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @InjectModel('RefreshToken')
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}
  async signup(data: SignupDto): Promise<AuthReturnType> {
    try {
      const { email, password, username } = data;
      const existingUser = await this.userService.findUserByEmail(email);
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }
      const saltRounds = parseInt(
        this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10',
        10,
      );
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = await this.userService.createUser({
        email,
        password: hashedPassword,
        username,
      });
      this.logger.log(`User ${email} signed up successfully`);
      const payload: JwtPayload = {
        sub: newUser._id,
        email: newUser.email,
        username: newUser.username,
      };
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '30d',
      });
      await this.saveRefreshToken(newUser._id, refreshToken);
      this.logger.log(`JWT token generated for user ${email}`);
      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Error during signup: ${error instanceof Error ? error.message : error || 'Unknown error'}`,
      );
      throw error;
    }
  }

  async login(data: LoginDto): Promise<AuthReturnType> {
    try {
      const { email, password } = data;
      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid credentials');
      }

      const payload: JwtPayload = {
        sub: user._id.toString(),
        email: user.email,
        username: user.username,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN') || '15m',
      });

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '30d',
      });

      await this.deleteOldRefreshToken(user._id);
      await this.saveRefreshToken(user._id, refreshToken);

      this.logger.log(`User ${email} logged in successfully`);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl || '',
          bio: user.bio || '',
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error during login: ${error instanceof Error ? error.message : error || 'Unknown error'}`,
      );
      throw error;
    }
  }

  async findRefreshToken(userId: string): Promise<RefreshTokenDocument | null> {
    return this.refreshTokenModel.findOne({ userId });
  }

  async deleteOldRefreshToken(userId: string): Promise<void> {
    await this.refreshTokenModel.deleteMany({ userId });
  }

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10',
      10,
    );
    const refreshToken = new this.refreshTokenModel({
      userId,
      tokenHash: await bcrypt.hash(token, saltRounds),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
    });
    await refreshToken.save();
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const payload: JwtPayload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const storedTokens = await this.refreshTokenModel.find({
        userId: payload.sub,
      });
      // Check each stored token
      const validToken = await Promise.all(
        storedTokens.map(async (stored) => {
          const isValid = await bcrypt.compare(refreshToken, stored.tokenHash);
          return isValid && stored.expiresAt > new Date() ? stored : null;
        }),
      );

      if (!validToken.some((t) => t !== null)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.refreshTokenModel.deleteOne({
        _id: validToken.find((t) => t !== null)?._id,
      });

      const newAccessToken = this.jwtService.sign({
        sub: payload.sub,
        email: payload.email,
        username: payload.username,
      });

      const newRefreshToken = this.jwtService.sign(
        { sub: payload.sub, email: payload.email },
        {
          expiresIn:
            this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '30d',
        },
      );
      await this.saveRefreshToken(payload.sub, newRefreshToken);

      return { access_token: newAccessToken, refresh_token: newRefreshToken };
    } catch (error: any) {
      this.logger.error(
        `Error during token refresh: ${error instanceof Error ? error.message : error || 'Unknown error'}`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<boolean> {
    await this.deleteOldRefreshToken(userId);
    this.logger.log(`User ${userId} logged out successfully`);
    return true;
  }

  async validateUser(
    payload: JwtPayload,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
