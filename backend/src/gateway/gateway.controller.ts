import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Gateway')
@Controller('gateway')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get('online/:userId')
  @ApiOperation({ summary: 'Check if a user is online' })
  @ApiResponse({ status: 200, description: 'User online status' })
  checkOnline(@Param('userId') userId: string) {
    const isOnline = this.gatewayService.isUserOnline(userId);
    return { userId, online: isOnline };
  }

  @Post('online/batch')
  @ApiOperation({ summary: 'Check online status for multiple users' })
  @ApiResponse({ status: 200, description: 'Batch online status' })
  checkOnlineBatch(@Body('userIds') userIds: string[]) {
    const status = this.gatewayService.getOnlineUsers(userIds);
    return { status };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get WebSocket connection stats' })
  @ApiResponse({ status: 200, description: 'Connection statistics' })
  getStats() {
    return this.gatewayService.getConnectionStats();
  }
}
