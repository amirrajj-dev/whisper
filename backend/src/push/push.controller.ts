import { Controller, Post, Delete, Get, Body, UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/common/types/user.type';
import { RegisterDeviceDto } from 'src/common/dtos/push/register-device.dto';
import { UnregisterDeviceDto } from 'src/common/dtos/push/unregister-device.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Push Notifications')
@Controller('push')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a device push token' })
  @ApiResponse({ status: 201, description: 'Token registered' })
  async registerToken(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: RegisterDeviceDto,
  ) {
    await this.pushService.registerToken(
      user._id,
      dto.token,
      dto.platform,
      dto.deviceName,
    );
    return { message: 'Device registered for push notifications' };
  }

  @Post('unregister')
  @ApiOperation({ summary: 'Unregister a device push token' })
  @ApiResponse({ status: 200, description: 'Token unregistered' })
  async unregisterToken(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: UnregisterDeviceDto,
  ) {
    await this.pushService.unregisterToken(user._id, dto.token);
    return { message: 'Device unregistered from push notifications' };
  }

  @Post('unregister-all')
  @ApiOperation({
    summary: 'Unregister all device push tokens for current user',
  })
  @ApiResponse({ status: 200, description: 'All tokens unregistered' })
  async unregisterAllTokens(@CurrentUser() user: Omit<User, 'password'>) {
    await this.pushService.unregisterAllTokens(user._id);
    return { message: 'All devices unregistered from push notifications' };
  }

  @Get('devices')
  @ApiOperation({ summary: 'List registered devices' })
  @ApiResponse({ status: 200, description: 'List of registered devices' })
  async getDevices(@CurrentUser() user: Omit<User, 'password'>) {
    const tokens = await this.pushService.getUserTokens(user._id);
    return tokens.map((t) => ({
      id: t._id,
      platform: t.platform,
      deviceName: t.deviceName,
      lastUsedAt: t.lastUsedAt,
      createdAt: t.createdAt,
    }));
  }
}
