import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GatewayService } from './gateway.service';
import { MessageDocument } from 'src/common/schemas/message.schema';
import { UserDocument } from 'src/common/schemas/user.schema';
import { ConversationDocument } from 'src/common/schemas/conversation.schema';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4000',
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly jwtService: JwtService,
    @InjectModel('Conversation')
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    @InjectModel('Message') private messageModel: Model<MessageDocument>,
  ) {}

  afterInit(server: Server): void {
    this.gatewayService.setServer(server);
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        username: string;
      }>(token);
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
      };
      client.data.conversationIds = [];

      this.gatewayService.registerSocket(payload.sub, client.id);

      const conversations = await this.conversationModel
        .find({ participants: payload.sub })
        .select('_id')
        .lean();

      const conversationIds = (
        conversations as Array<{ _id: Types.ObjectId }>
      ).map((c) => c._id.toString());
      client.data.conversationIds = conversationIds;

      for (const convId of conversationIds) {
        await client.join(`conversation:${convId}`);
      }

      const onlinePayload = {
        userId: payload.sub,
        username: payload.username,
        lastSeen: null,
      };
      for (const convId of conversationIds) {
        client.to(`conversation:${convId}`).emit('user:online', onlinePayload);
      }

      client.emit('connected', { userId: payload.sub });
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = this.gatewayService.unregisterSocket(client.id);
    if (!userId) return;

    const conversationIds: string[] = client.data?.conversationIds ?? [];

    await this.userModel.findByIdAndUpdate(userId, { lastSeen: new Date() });

    if (!this.gatewayService.isUserOnline(userId)) {
      const offlinePayload = { userId, lastSeen: new Date().toISOString() };
      for (const convId of conversationIds) {
        this.server
          .to(`conversation:${convId}`)
          .emit('user:offline', offlinePayload);
      }
    }
  }

  @SubscribeMessage('join:conversation')
  handleJoinConversation(
    client: Socket,
    payload: { conversationId: string },
  ): void {
    if (!payload?.conversationId) return;
    client.join(`conversation:${payload.conversationId}`);
  }

  @SubscribeMessage('leave:conversation')
  handleLeaveConversation(
    client: Socket,
    payload: { conversationId: string },
  ): void {
    if (!payload?.conversationId) return;
    client.leave(`conversation:${payload.conversationId}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(client: Socket, payload: { conversationId: string }): void {
    if (!payload?.conversationId) return;
    client.to(`conversation:${payload.conversationId}`).emit('user:typing', {
      userId: client.data.user.id,
      conversationId: payload.conversationId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(client: Socket, payload: { conversationId: string }): void {
    if (!payload?.conversationId) return;
    client
      .to(`conversation:${payload.conversationId}`)
      .emit('user:stop_typing', {
        userId: client.data.user.id,
        conversationId: payload.conversationId,
      });
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    client: Socket,
    payload: { conversationId: string; messageId: string },
  ): Promise<void> {
    if (!payload?.conversationId || !payload?.messageId) return;
    await this.messageModel.updateOne(
      { _id: payload.messageId },
      { $addToSet: { readBy: client.data.user.id } },
    );

    // Broadcast to room
    client.to(`conversation:${payload.conversationId}`).emit('message:read', {
      userId: client.data.user.id,
      conversationId: payload.conversationId,
      messageId: payload.messageId,
      readAt: new Date().toISOString(),
    });
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth?.token as string | undefined;
    const query = client.handshake.query?.token as string | undefined;
    const rawToken = auth || query;
    if (!rawToken) return null;
    if (rawToken.startsWith('Bearer ')) {
      return rawToken.slice(7);
    }
    return rawToken;
  }
}
