import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Server } from 'socket.io';
import { ChatEvents, NotificationEvents } from 'src/common/constants/events.constants';

@Injectable()
export class GatewayService implements OnModuleInit {
  private server: Server;
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly socketUsers = new Map<string, string>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  onModuleInit() {
    // Listen to chat events
    this.eventEmitter.on(
      ChatEvents.MESSAGE_SENT,
      this.handleMessageSent.bind(this),
    );
    this.eventEmitter.on(
      ChatEvents.MESSAGE_EDITED,
      this.handleMessageEdited.bind(this),
    );
    this.eventEmitter.on(
      ChatEvents.MESSAGE_DELETED,
      this.handleMessageDeleted.bind(this),
    );
    this.eventEmitter.on(
      ChatEvents.MESSAGE_READ,
      this.handleMessageRead.bind(this),
    );
    this.eventEmitter.on(
      ChatEvents.MESSAGES_READ,
      this.handleMessagesRead.bind(this),
    );
    this.eventEmitter.on(
      ChatEvents.CONVERSATION_CREATED,
      this.handleConversationCreated.bind(this),
    );
    this.eventEmitter.on(
      ChatEvents.CONVERSATION_UPDATED,
      this.handleConversationUpdated.bind(this),
    );
    this.eventEmitter.on(
      ChatEvents.CONVERSATION_DELETED,
      this.handleConversationDeleted.bind(this),
    );
    this.eventEmitter.on(
      ChatEvents.PARTICIPANT_ADDED,
      this.handleParticipantAdded.bind(this),
    );
    this.eventEmitter.on(
      ChatEvents.PARTICIPANT_REMOVED,
      this.handleParticipantRemoved.bind(this),
    );
    this.eventEmitter.on(
      ChatEvents.PARTICIPANT_ROLE_CHANGED,
      this.handleRoleChanged.bind(this),
    );
    this.eventEmitter.on(
      ChatEvents.OWNERSHIP_TRANSFERRED,
      this.handleOwnershipTransferred.bind(this),
    );
    this.eventEmitter.on(
      NotificationEvents.NOTIFICATION_CREATED,
      this.handleNotificationCreated.bind(this),
    );
  }

  setServer(server: Server): void {
    this.server = server;
  }

  registerSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
    this.socketUsers.set(socketId, userId);
  }

  unregisterSocket(socketId: string): string | null {
    const userId = this.socketUsers.get(socketId) ?? null;
    if (!userId) return null;

    this.socketUsers.delete(socketId);
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    return userId;
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    if (!this.server) return;
    const socketIds = this.userSockets.get(userId);
    if (!socketIds || socketIds.size === 0) return;
    for (const socketId of socketIds) {
      this.server.to(socketId).emit(event, data);
    }
  }

  getOnlineUsers(userIds: string[]): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const userId of userIds) {
      result[userId] = this.isUserOnline(userId);
    }
    return result;
  }

  async isUserInConversation(userId: string, conversationId: string): Promise<boolean> {
    if (!this.server) return false;
    const socketIds = this.userSockets.get(userId);
    if (!socketIds || socketIds.size === 0) return false;
    const roomName = `conversation:${conversationId}`;
    const room = this.server.sockets.adapter.rooms.get(roomName);
    if (!room) return false;
    for (const socketId of socketIds) {
      if (room.has(socketId)) return true;
    }
    return false;
  }

  getConnectionStats(): { onlineUsers: number; activeSockets: number } {
    return {
      onlineUsers: this.userSockets.size,
      activeSockets: this.socketUsers.size,
    };
  }

  emitToConversation(
    conversationId: string,
    event: string,
    data: unknown,
    excludeUserId?: string,
  ): void {
    if (!this.server) return;
    const room = `conversation:${conversationId}`;
    if (excludeUserId) {
      const excludeSockets = this.userSockets.get(excludeUserId);
      if (excludeSockets && excludeSockets.size > 0) {
        this.server
          .to(room)
          .except(Array.from(excludeSockets))
          .emit(event, data);
        return;
      }
    }
    this.server.to(room).emit(event, data);
  }

  // Event Handlers
  private handleMessageSent(data: any): void {
    this.emitToConversation(data.conversationId, 'message:new', data);
  }

  private handleMessageEdited(data: any): void {
    this.emitToConversation(data.conversationId, 'message:edited', data);
  }

  private handleMessageDeleted(data: any): void {
    this.emitToConversation(data.conversationId, 'message:deleted', data);
  }

  private handleMessageRead(data: any): void {
    this.emitToConversation(data.conversationId, 'message:read', data);
  }

  private handleMessagesRead(data: any): void {
    this.emitToConversation(data.conversationId, 'messages:read', data);
  }

  private handleConversationCreated(data: any): void {
    for (const participantId of data.participants) {
      this.emitToUser(participantId, 'conversation:new', data);
    }
  }

  private handleConversationUpdated(data: any): void {
    this.emitToConversation(data.conversationId, 'conversation:updated', data);
  }

  private handleConversationDeleted(data: any): void {
    this.emitToConversation(data.conversationId, 'conversation:deleted', data);
  }

  private handleParticipantAdded(data: any): void {
    this.emitToConversation(data.conversationId, 'participant:added', data);
    for (const newUserId of data.newParticipants) {
      this.emitToUser(newUserId, 'conversation:new', data.conversation);
    }
  }

  private handleParticipantRemoved(data: any): void {
    this.emitToConversation(data.conversationId, 'participant:removed', data);
    this.emitToUser(data.removedUserId, 'participant:removed', data);
  }

  private handleRoleChanged(data: any): void {
    this.emitToConversation(
      data.conversationId,
      'participant:role_changed',
      data,
    );
  }

  private handleOwnershipTransferred(data: any): void {
    this.emitToConversation(
      data.conversationId,
      'conversation:ownership_transferred',
      data,
    );
  }

  private handleNotificationCreated(data: any): void {
    this.emitToUser(data.userId, 'notification:new', data.notification);
  }
}
