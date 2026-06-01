import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('gateway')
@UseGuards(JwtAuthGuard)
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get('online/:userId')
  checkOnline(@Param('userId') userId: string) {
    const isOnline = this.gatewayService.isUserOnline(userId);
    return { userId, online: isOnline };
  }

  @Post('online/batch')
  checkOnlineBatch(@Body('userIds') userIds: string[]) {
    const status = this.gatewayService.getOnlineUsers(userIds);
    return { status };
  }

  @Get('stats')
  getStats() {
    return this.gatewayService.getConnectionStats();
  }
}
