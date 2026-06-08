import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';
import { ChatEvents } from 'src/common/constants/events.constants';
import { GatewayService } from 'src/gateway/gateway.service';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);
  constructor(
    private readonly notificationService: NotificationService,
    private readonly gatewayService: GatewayService,
  ) {}

  @OnEvent(ChatEvents.MESSAGE_SENT)
  async handleMessageSent(payload: any) {
    const {
      conversationId,
      senderId,
      senderUsername,
      type,
      content,
      participants,
    } = payload;

    const notificationMessage =
      type === 'text' ? content.substring(0, 100) : `Sent a ${type}`;

    const otherParticipants = (participants as string[]).filter(
      (id) => id !== senderId,
    );

    await Promise.all(
      otherParticipants.map(async (userId) => {
        const isInRoom = await this.gatewayService.isUserInConversation(
          userId,
          conversationId,
        );
        if (isInRoom) return;

        // User isn't in the conversation room — emit message:new directly to
        // their socket(s) so the chat cache updates immediately, alongside
        // the notification for the drawer
        this.gatewayService.emitToUser(userId, 'message:new', payload);

        return this.notificationService
          .create({
            userId,
            type: 'message',
            relatedConversation: conversationId,
            message: `${senderUsername}: ${notificationMessage}`,
          })
          .catch((error) => {
            this.logger?.error?.(
              `Failed to create notification for ${userId}: ${error instanceof Error ? error.message : error}`,
            );
          });
      }),
    );
  }

  @OnEvent(ChatEvents.PARTICIPANT_ADDED)
  async handleParticipantAdded(payload: any) {
    const groupName = payload.conversationName || 'Group';
    await Promise.all(
      payload.newParticipants.map((userId: string) =>
        this.notificationService
          .create({
            userId,
            type: 'system',
            relatedConversation: payload.conversationId,
            message: `You were added to "${groupName}"`,
          })
          .catch((error) => {
            this.logger?.error?.(
              `Failed to create notification for ${userId}: ${error instanceof Error ? error.message : error}`,
            );
          }),
      ),
    );
  }

  @OnEvent(ChatEvents.PARTICIPANT_REMOVED)
  async handleParticipantRemoved(payload: any) {
    const groupName = payload.conversationName || 'Group';
    await this.notificationService.create({
      userId: payload.removedUserId,
      type: 'system',
      relatedConversation: payload.conversationId,
      message: `You were removed from "${groupName}"`,
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
  }

  @OnEvent(ChatEvents.OWNERSHIP_TRANSFERRED)
  async handleOwnershipTransferred(payload: any) {
    const groupName = payload.conversationName || 'Group';
    await this.notificationService.create({
      userId: payload.newOwnerId,
      type: 'system',
      relatedConversation: payload.conversationId,
      message: `You are now the owner of "${groupName}"`,
    });
  }

  @OnEvent(ChatEvents.CONVERSATION_DELETED)
  async handleConversationDeleted(payload: any) {
    const groupName = payload.conversationName || 'Group';
    const otherParticipants = (payload.participants as string[]).filter(
      (id) => id !== payload.deletedBy,
    );

    await Promise.all(
      otherParticipants.map((userId: string) =>
        this.notificationService
          .create({
            userId,
            type: 'system',
            relatedConversation: payload.conversationId,
            message: `"${groupName}" was deleted by the owner`,
          })
          .catch((error) => {
            this.logger?.error?.(
              `Failed to create notification for ${userId}: ${error instanceof Error ? error.message : error}`,
            );
          }),
      ),
    );
  }
}
