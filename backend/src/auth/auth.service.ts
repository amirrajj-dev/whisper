import {
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
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
import { REFRESH_TOKEN_EXPIRY } from 'src/common/constants/auth.constants';

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
      this.logger.log(`Signup attempt for email: ${data.email}`);
      const { email, password, username } = data;

      const existingUser = await this.userService.findUserByEmail(email);
      if (existingUser) {
        this.logger.warn(`Signup failed - email already exists: ${email}`);
        throw new BadRequestException('User with this email already exists');
      }

      const isUsernameTaken = await this.userService.isUsernameTaken(username);
      if (isUsernameTaken) {
        this.logger.warn(`Signup failed - username already taken: ${username}`);
        throw new NotAcceptableException('username already taken');
      }

      const saltRounds = parseInt(
        this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10',
        10,
      );
      this.logger.debug(`Using salt rounds: ${saltRounds}`);

      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = await this.userService.createUser({
        email,
        password: hashedPassword,
        username,
      });

      this.logger.log(
        `User ${email} created successfully with id: ${newUser._id}`,
      );

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
      this.logger.log(`JWT tokens generated for user ${email}`);

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
      this.logger.log(`Login attempt for email: ${data.email}`);
      const { email, password } = data;

      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        this.logger.warn(`Login failed - user not found: ${email}`);
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Login failed - invalid credentials for: ${email}`);
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
    this.logger.debug(`Finding refresh token for user: ${userId}`);
    return this.refreshTokenModel.findOne({ userId });
  }

  async deleteOldRefreshToken(userId: string): Promise<void> {
    this.logger.debug(`Deleting old refresh tokens for user: ${userId}`);
    const result = await this.refreshTokenModel.deleteMany({ userId });
    this.logger.debug(
      `Deleted ${result.deletedCount} refresh tokens for user: ${userId}`,
    );
  }

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    this.logger.debug(`Saving refresh token for user: ${userId}`);
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
    this.logger.debug(
      `Refresh token saved for user: ${userId}, expires at: ${refreshToken.expiresAt.toString()}`,
    );
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      this.logger.log(`Refresh token attempt`);

      const payload: JwtPayload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      this.logger.debug(`Token verified for user: ${payload.sub}`);

      const storedTokens = await this.refreshTokenModel.find({
        userId: payload.sub,
      });
      this.logger.debug(
        `Found ${storedTokens.length} stored tokens for user: ${payload.sub}`,
      );

      // Check each stored token
      const validToken = await Promise.all(
        storedTokens.map(async (stored) => {
          const isValid = await bcrypt.compare(refreshToken, stored.tokenHash);
          return isValid && stored.expiresAt > new Date() ? stored : null;
        }),
      );

      if (!validToken.some((t) => t !== null)) {
        this.logger.warn(`Invalid refresh token for user: ${payload.sub}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokenToDelete = validToken.find((t) => t !== null);
      await this.refreshTokenModel.deleteOne({
        _id: tokenToDelete?._id,
      });
      this.logger.debug(`Deleted old refresh token for user: ${payload.sub}`);

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

      this.logger.log(`Tokens refreshed successfully for user: ${payload.sub}`);

      return { access_token: newAccessToken, refresh_token: newRefreshToken };
    } catch (error: any) {
      this.logger.error(
        `Error during token refresh: ${error instanceof Error ? error.message : error || 'Unknown error'}`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<boolean> {
    this.logger.log(`Logout attempt for user: ${userId}`);
    await this.deleteOldRefreshToken(userId);
    this.logger.log(`User ${userId} logged out successfully`);
    return true;
  }

  async validateUser(
    payload: JwtPayload,
  ): Promise<Omit<User, 'password'> | null> {
    this.logger.debug(`Validating user from token: ${payload.sub}`);
    try {
      const user = await this.userService.findUserById(payload.sub);
      if (!user) {
        this.logger.warn(`Invalid token - user not found: ${payload.sub}`);
        throw new UnauthorizedException('Invalid token');
      }
      this.logger.debug(`User validated successfully: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error(
        `error validating user ${payload.sub}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}
