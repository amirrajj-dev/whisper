import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/common/types/user.type';
import { PaginationDto } from 'src/common/dtos/pagination/pagination.dto';

@Controller('notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query() pagination: PaginationDto,
  ) {
    return this.notificationService.findByUser(
      user._id,
      pagination.page,
      pagination.limit,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: Omit<User, 'password'>) {
    return this.notificationService.getUnreadCount(user._id);
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id') notificationId: string,
  ) {
    return this.notificationService.markAsRead(notificationId, user._id);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: Omit<User, 'password'>) {
    return this.notificationService.markAllAsRead(user._id);
  }

  @Delete(':id')
  async deleteNotification(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id') notificationId: string,
  ) {
    return this.notificationService.delete(notificationId, user._id);
  }
}
