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
import { Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  private readonly typingLimiter = new Map<string, number>();
  private readonly readLimiter = new Map<string, number>();

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
        this.logger.warn(`Connection rejected: no token from ${client.id}`);
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
      this.logger.log(
        `Socket connected: user=${payload.sub} socket=${client.id}`,
      );

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
      this.logger.log(
        `User ${payload.sub} joined ${conversationIds.length} rooms`,
      );

      const onlinePayload = {
        userId: payload.sub,
        username: payload.username,
        lastSeen: null,
      };
      for (const convId of conversationIds) {
        client.to(`conversation:${convId}`).emit('user:online', onlinePayload);
      }

      client.emit('connected', { userId: payload.sub });
    } catch (err) {
      this.logger.warn(
        `Connection rejected for ${client.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = this.gatewayService.unregisterSocket(client.id);
    if (!userId) return;

    if (userId) {
      this.typingLimiter.delete(userId);
    }

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
    const userId = client.data?.user?.id;
    this.logger.log(
      `join:conversation user=${userId} conv=${payload.conversationId}`,
    );
    client.join(`conversation:${payload.conversationId}`);
  }

  @SubscribeMessage('leave:conversation')
  handleLeaveConversation(
    client: Socket,
    payload: { conversationId: string },
  ): void {
    if (!payload?.conversationId) return;
    const userId = client.data?.user?.id;
    this.logger.log(
      `leave:conversation user=${userId} conv=${payload.conversationId}`,
    );
    client.leave(`conversation:${payload.conversationId}`);
  }

  @SubscribeMessage('conversation:viewing')
  handleConversationViewing(
    client: Socket,
    payload: { conversationId: string },
  ): void {
    if (!payload?.conversationId) return;
    const userId = client.data?.user?.id;
    if (!userId) return;
    this.gatewayService.setActiveConversation(
      client.id,
      payload.conversationId,
    );
  }

  @SubscribeMessage('conversation:stopped_viewing')
  handleConversationStoppedViewing(client: Socket): void {
    const userId = client.data?.user?.id;
    if (!userId) return;
    this.gatewayService.setActiveConversation(client.id, null);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(client: Socket, payload: { conversationId: string }): void {
    if (!payload?.conversationId) return;

    const userId = client.data.user.id;
    const now = Date.now();
    const lastTyping = this.typingLimiter.get(userId) || 0;

    if (now - lastTyping < 2000) return;
    this.logger.log(
      `typing:start user=${userId} conv=${payload.conversationId}`,
    );

    this.typingLimiter.set(userId, now);

    client.to(`conversation:${payload.conversationId}`).emit('user:typing', {
      userId,
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
    payload: { conversationId: string },
  ): Promise<void> {
    if (!payload?.conversationId) return;

    const userId = client.data.user.id;
    const now = Date.now();
    const lastRead = this.readLimiter.get(userId) || 0;

    // Limit to 1 read receipt per second
    if (now - lastRead < 1000) return;

    this.readLimiter.set(userId, now);

    await this.messageModel.updateMany(
      {
        conversationId: payload.conversationId,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId, deliveredTo: userId } },
    );

    client.to(`conversation:${payload.conversationId}`).emit('messages:read', {
      userId,
      conversationId: payload.conversationId,
      readAt: new Date().toISOString(),
    });
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken as string;
    }
    const auth = client.handshake.headers.authorization;
    if (auth) {
      return auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    }
    const cookieHeader = client.handshake.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(
        /(?:^|;\s*)whisper_access_token=([^;]*)/,
      );
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
    return null;
  }
}
