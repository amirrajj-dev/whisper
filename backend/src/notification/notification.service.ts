import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationDocument } from 'src/common/schemas/notification.schema';
import { GatewayService } from 'src/gateway/gateway.service';
import { NotificationEvents } from 'src/common/constants/events.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel('Notification')
    private notificationModel: Model<NotificationDocument>,
    private readonly gatewayService: GatewayService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data: {
    userId: string;
    type: string;
    relatedConversation?: string;
    message: string;
  }) {
    try {
      const notification = new this.notificationModel({
        ...data,
        isRead: false,
      });
      await notification.save();

      // Emit via event emitter
      this.eventEmitter.emit(NotificationEvents.NOTIFICATION_CREATED, {
        userId: data.userId,
        notification: {
          id: notification._id,
          type: notification.type,
          message: notification.message,
          relatedConversation: notification.relatedConversation,
          createdAt: notification.createdAt,
        },
      });

      this.logger.log(`Notification created for user ${data.userId}`);
      return notification;
    } catch (error) {
      this.logger.error(
        `Error creating notification: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async findByUser(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;
      const safeLimit = Math.min(limit, 50);

      const [notifications, total] = await Promise.all([
        this.notificationModel
          .find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(safeLimit)
          .exec(),
        this.notificationModel.countDocuments({ userId }),
      ]);

      return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / safeLimit),
      };
    } catch (error) {
      this.logger.error(
        `Error fetching notifications: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await this.notificationModel.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true, updatedAt: new Date() },
        { new: true },
      );
      if (!notification) {
        throw new NotFoundException('Notification not found');
      }
      return notification;
    } catch (error) {
      this.logger.error(
        `Error marking as read: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    try {
      await this.notificationModel.updateMany(
        { userId, isRead: false },
        { isRead: true, updatedAt: new Date() },
      );
      return { message: 'All notifications marked as read' };
    } catch (error) {
      this.logger.error(
        `Error marking all as read: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const count = await this.notificationModel.countDocuments({
        userId,
        isRead: false,
      });
      return { count };
    } catch (error) {
      this.logger.error(
        `Error getting unread count: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async delete(id: string, userId: string) {
    try {
      const result = await this.notificationModel.findOneAndDelete({
        _id: id,
        userId,
      });
      if (!result) {
        throw new NotFoundException('Notification not found');
      }
      return { message: 'Notification deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting notification: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}
