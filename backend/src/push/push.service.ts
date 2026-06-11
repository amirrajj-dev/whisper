import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DeviceTokenDocument,
  DevicePlatform,
} from 'src/common/schemas/device-token.schema';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

export interface PushPayload {
  to: string;
  title?: string;
  subtitle?: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: string;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  categoryId?: string;
}

export interface ExpoPushResponse {
  data: Array<{
    id: string;
    status: 'ok' | 'error';
    message?: string;
    details?: Record<string, unknown>;
  }>;
  errors?: Array<{ message: string }>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectModel('DeviceToken')
    private deviceTokenModel: Model<DeviceTokenDocument>,
  ) {}

  async registerToken(
    userId: string,
    token: string,
    platform: DevicePlatform,
    deviceName?: string,
  ): Promise<void> {
    try {
      await this.deviceTokenModel.findOneAndUpdate(
        { token },
        {
          userId,
          token,
          platform,
          deviceName: deviceName || null,
          lastUsedAt: new Date(),
        },
        { upsert: true, new: true },
      );
      this.logger.log(
        `Device token registered for user ${userId} (${platform})`,
      );
    } catch (error) {
      this.logger.error(
        `Error registering device token: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async unregisterToken(userId: string, token: string): Promise<void> {
    try {
      await this.deviceTokenModel.findOneAndDelete({ userId, token });
      this.logger.log(`Device token unregistered for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error unregistering device token: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async unregisterAllTokens(userId: string): Promise<void> {
    try {
      const result = await this.deviceTokenModel.deleteMany({ userId });
      if (result.deletedCount > 0) {
        this.logger.log(
          `All device tokens removed for user ${userId} (${result.deletedCount} tokens)`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error removing all device tokens: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async getUserTokens(userId: string): Promise<DeviceTokenDocument[]> {
    try {
      return await this.deviceTokenModel
        .find({ userId })
        .sort({ lastUsedAt: -1 })
        .exec();
    } catch (error) {
      this.logger.error(
        `Error fetching device tokens: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async sendPushToUser(
    userId: string,
    payload: Omit<PushPayload, 'to'>,
    badgeCount?: number,
  ): Promise<void> {
    try {
      const tokens = await this.getUserTokens(userId);
      if (tokens.length === 0) return;

      const messages: PushPayload[] = tokens.map((t) => ({
        to: t.token,
        ...payload,
        badge: badgeCount ?? payload.badge,
        sound: payload.sound || 'default',
        priority: payload.priority || 'high',
      }));

      await this.sendPushBatch(
        messages,
        tokens.map((t) => t.token),
      );
    } catch (error) {
      this.logger.error(
        `Error sending push to user ${userId}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async sendPushBatch(
    messages: PushPayload[],
    allTokens: string[],
  ): Promise<void> {
    try {
      const response = await fetch(EXPO_PUSH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        this.logger.error(
          `Expo Push API returned ${response.status}: ${response.statusText}`,
        );
        return;
      }

      const result: ExpoPushResponse = await response.json();

      if (result.errors) {
        for (const err of result.errors) {
          this.logger.error(`Expo Push API error: ${err.message}`);
        }
      }

      const invalidTokens: string[] = [];
      for (let i = 0; i < result.data.length; i++) {
        const item = result.data[i];
        if (item.status === 'error') {
          if (
            item.message &&
            (item.message.includes('Invalid') ||
              item.message.includes('NotRegistered') ||
              item.message.includes('DeviceNotRegistered'))
          ) {
            invalidTokens.push(allTokens[i]);
          } else {
            this.logger.warn(
              `Push delivery error for token ${allTokens[i].slice(0, 20)}...: ${item.message}`,
            );
          }
        }
      }

      if (invalidTokens.length > 0) {
        await this.cleanupInvalidTokens(invalidTokens);
      }
    } catch (error) {
      this.logger.error(
        `Expo Push API request failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async cleanupInvalidTokens(tokens: string[]): Promise<void> {
    try {
      const result = await this.deviceTokenModel.deleteMany({
        token: { $in: tokens },
      });
      if (result.deletedCount > 0) {
        this.logger.log(
          `Cleaned up ${result.deletedCount} invalid device tokens`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error cleaning up invalid tokens: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async removeToken(token: string): Promise<void> {
    try {
      await this.deviceTokenModel.findOneAndDelete({ token });
    } catch (error) {
      this.logger.error(
        `Error removing token: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
