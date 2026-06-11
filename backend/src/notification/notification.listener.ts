import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';
import { PushService } from 'src/push/push.service';
import { ChatEvents } from 'src/common/constants/events.constants';
import { GatewayService } from 'src/gateway/gateway.service';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);
  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushService: PushService,
    private readonly gatewayService: GatewayService,
  ) {}

  @OnEvent(ChatEvents.MESSAGE_SENT)
  async handleMessageSent(payload: any) {
    const {
      conversationId,
      conversationType,
      conversationName,
      senderId,
      senderUsername,
      type,
      content,
      participants,
    } = payload;

    const isGroup = conversationType === 'group';
    const groupLabel = conversationName || 'Group';

    const notificationMessage =
      type === 'text' ? content.substring(0, 100) : `Sent a ${type}`;

    const displayMessage = isGroup
      ? `${senderUsername}: ${notificationMessage} (in ${groupLabel})`
      : `${senderUsername}: ${notificationMessage}`;

    const otherParticipants = (participants as string[]).filter(
      (id) => id !== senderId,
    );

    await Promise.all(
      otherParticipants.map(async (userId) => {
        if (this.gatewayService.shouldSuppressPush(userId, conversationId))
          return;

        const isInRoom = await this.gatewayService.isUserInConversation(
          userId,
          conversationId,
        );
        if (!isInRoom) {
          this.gatewayService.emitToUser(userId, 'message:new', payload);
        }

        const inAppPromise = this.notificationService
          .create({
            userId,
            type: 'message',
            relatedConversation: conversationId,
            message: displayMessage,
          })
          .catch((error) => {
            this.logger?.error?.(
              `Failed to create notification for ${userId}: ${error instanceof Error ? error.message : error}`,
            );
          });

        const badgePromise = this.notificationService
          .getUnreadCount(userId)
          .then((result) => result.count)
          .catch(() => 1);

        const pushTitle = isGroup ? groupLabel : senderUsername;
        const pushBody = isGroup ? notificationMessage : notificationMessage;

        const pushPromise = badgePromise.then((badge) =>
          this.pushService
            .sendPushToUser(userId, {
              title: pushTitle,
              subtitle: isGroup ? senderUsername : undefined,
              body: pushBody,
              data: {
                type: 'message',
                conversationId,
                conversationType,
                conversationName: conversationName || null,
                senderId,
                senderName: senderUsername,
              },
              badge,
              channelId: isGroup ? 'groups' : 'messages',
              priority: 'high',
            })
            .catch((error) => {
              this.logger?.error?.(
                `Failed to send push to ${userId}: ${error instanceof Error ? error.message : error}`,
              );
            }),
        );

        return Promise.all([inAppPromise, pushPromise]);
      }),
    );
  }

  @OnEvent(ChatEvents.PARTICIPANT_REMOVED)
  async handleParticipantRemoved(payload: any) {
    const groupName = payload.conversationName || 'Group';
    const message = `You were removed from "${groupName}"`;

    await this.notificationService.create({
      userId: payload.removedUserId,
      type: 'system',
      relatedConversation: payload.conversationId,
      message,
    });

    await this.pushService.sendPushToUser(payload.removedUserId, {
      title: 'Group Update',
      body: message,
      data: {
        type: 'system',
        conversationId: payload.conversationId,
        conversationType: 'group',
        conversationName: groupName,
      },
      channelId: 'system',
      priority: 'high',
    });
  }

  @OnEvent(ChatEvents.PARTICIPANT_ROLE_CHANGED)
  async handleRoleChanged(payload: any) {
    const groupName = payload.conversationName || 'Group';
    const message = payload.isPromotion
      ? `You are now an admin in "${groupName}"`
      : `You are no longer an admin in "${groupName}"`;

    await this.notificationService.create({
      userId: payload.targetUserId,
      type: 'system',
      relatedConversation: payload.conversationId,
      message,
    });

    await this.pushService.sendPushToUser(payload.targetUserId, {
      title: 'Group Update',
      body: message,
      data: {
        type: 'system',
        conversationId: payload.conversationId,
        conversationType: 'group',
        conversationName: groupName,
      },
      channelId: 'system',
      priority: 'high',
    });
  }

  @OnEvent(ChatEvents.OWNERSHIP_TRANSFERRED)
  async handleOwnershipTransferred(payload: any) {
    const groupName = payload.conversationName || 'Group';
    const message = `You are now the owner of "${groupName}"`;

    await this.notificationService.create({
      userId: payload.newOwnerId,
      type: 'system',
      relatedConversation: payload.conversationId,
      message,
    });

    await this.pushService.sendPushToUser(payload.newOwnerId, {
      title: 'Group Update',
      body: message,
      data: {
        type: 'system',
        conversationId: payload.conversationId,
        conversationType: 'group',
        conversationName: groupName,
      },
      channelId: 'system',
      priority: 'high',
    });
  }

  @OnEvent(ChatEvents.CONVERSATION_DELETED)
  async handleConversationDeleted(payload: any) {
    const groupName = payload.conversationName || 'Group';
    const otherParticipants = (payload.participants as string[]).filter(
      (id) => id !== payload.deletedBy,
    );

    await Promise.all(
      otherParticipants.map(async (userId: string) => {
        const message = `"${groupName}" was deleted by the owner`;

        await this.notificationService
          .create({
            userId,
            type: 'system',
            relatedConversation: payload.conversationId,
            message,
          })
          .catch((error) => {
            this.logger?.error?.(
              `Failed to create notification for ${userId}: ${error instanceof Error ? error.message : error}`,
            );
          });

        await this.pushService
          .sendPushToUser(userId, {
            title: 'Group Deleted',
            body: message,
            data: {
              type: 'system',
              conversationId: payload.conversationId,
              conversationType: 'group',
              conversationName: groupName,
            },
            channelId: 'system',
            priority: 'high',
          })
          .catch((error) => {
            this.logger?.error?.(
              `Failed to send push to ${userId}: ${error instanceof Error ? error.message : error}`,
            );
          });
      }),
    );
  }
}
