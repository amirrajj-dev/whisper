import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import mongoose, { Model } from 'mongoose';
import { AddParticipantsDto } from 'src/common/dtos/chat/add-participants.dto';
import { CreateConversationDto } from 'src/common/dtos/chat/create-conversation.dto';
import { EditMessageDto } from 'src/common/dtos/chat/edit-message.dto';
import { SendMessageDto } from 'src/common/dtos/chat/send-message.dto';
import { UpdateConversationDto } from 'src/common/dtos/chat/update-conversation.dto';
import { ConversationDocument } from 'src/common/schemas/conversation.schema';
import { MessageDocument } from 'src/common/schemas/message.schema';
import { ChatEvents } from 'src/common/constants/events.constants';
import { UploadService } from 'src/upload/upload.service';
import { UserService } from 'src/user/user.service';
import { UserDocument } from 'src/common/schemas/user.schema';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel('Conversation')
    private conversationModel: Model<ConversationDocument>,
    @InjectModel('Message') private messageModel: Model<MessageDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async getConversationCacheVersion(userId: string): Promise<number> {
    try {
      const verKey = `conv_ver:${userId}`;
      return (await this.cacheManager.get<number>(verKey)) || 0;
    } catch {
      return 0;
    }
  }

  private async invalidateConversationCache(userId: string): Promise<void> {
    try {
      const verKey = `conv_ver:${userId}`;
      const ver = (await this.cacheManager.get<number>(verKey)) || 0;
      await this.cacheManager.set(verKey, ver + 1, 1000 * 60 * 5);
    } catch {
      this.logger.warn('Cache invalidation failed, non-critical');
    }
  }

  private async invalidateConversationCacheForUsers(
    userIds: string[],
  ): Promise<void> {
    await Promise.all(
      userIds.map((id) => this.invalidateConversationCache(id)),
    );
  }

  async getUserConversations(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const safeLimit = Math.min(limit, 50);
    const version = await this.getConversationCacheVersion(userId);
    const cacheKey = `conversations:${userId}:${page}:${safeLimit}:v${version}`;
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached;
    } catch {
      this.logger.warn('Cache unavailable, falling through to DB');
    }

    try {
      const skip = (page - 1) * safeLimit;

      const [conversations, total] = await Promise.all([
        this.conversationModel.aggregate([
          { $match: { participants: new mongoose.Types.ObjectId(userId) } },
          { $sort: { lastMessageAt: -1 } },
          { $skip: skip },
          { $limit: safeLimit },
          {
            $lookup: {
              from: 'users',
              localField: 'participants',
              foreignField: '_id',
              as: 'participants',
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'createdBy',
              foreignField: '_id',
              as: 'createdBy',
            },
          },
          { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              'participants.password': 0,
              'participants.__v': 0,
              'createdBy.password': 0,
              'createdBy.__v': 0,
            },
          },
        ]),
        this.conversationModel.countDocuments({ participants: userId }),
      ]);
      this.logger.log(
        `User ${userId} fetched ${conversations.length} conversations`,
      );

      const result = {
        conversations,
        total,
        page,
        totalPages: Math.ceil(total / safeLimit),
      };

      try {
        await this.cacheManager.set(cacheKey, result, 1000 * 30);
      } catch {
        this.logger.warn('Failed to set cache, non-critical');
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching conversations for user ${userId}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async getMessages(
    userId: string,
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    try {
      this.logger.log(
        `User ${userId} fetching messages for conversation ${conversationId}`,
      );

      // Check if conversation exists and user is participant
      const conversation =
        await this.conversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId,
      );
      if (!isParticipant) {
        throw new UnauthorizedException(
          'You are not a participant of this conversation',
        );
      }

      const safeLimit = Math.min(limit, 100);
      const skip = (page - 1) * safeLimit;

      const [messages, total] = await Promise.all([
        this.messageModel
          .find({ conversationId })
          .populate('senderId', 'username email avatarUrl')
          .populate('replyTo', 'content type senderId')
          .populate({
            path: 'replyTo',
            populate: {
              path: 'senderId',
              select: 'username',
            },
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(safeLimit)
          .lean()
          .exec(),
        this.messageModel.countDocuments({ conversationId }),
      ]);

      await this.messageModel.updateMany(
        {
          conversationId,
          deliveredTo: { $ne: userId },
          senderId: { $ne: userId },
        },
        {
          $addToSet: { deliveredTo: userId },
        },
      );

      this.eventEmitter.emit(ChatEvents.MESSAGE_READ, {
        conversationId,
        userId,
        readAt: new Date(),
      });

      this.logger.log(
        `Fetched ${messages.length} messages for conversation ${conversationId}`,
      );

      return {
        messages: messages.reverse(),
        total,
        page,
        totalPages: Math.ceil(total / safeLimit),
      };
    } catch (error) {
      this.logger.error(
        `Error fetching messages: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async getConversationById(userId: string, conversationId: string) {
    try {
      this.logger.log(`User ${userId} fetching conversation ${conversationId}`);

      const conversation = await this.conversationModel
        .findById(conversationId)
        .populate('participants', 'username email avatarUrl bio lastSeen')
        .populate('createdBy', 'username email avatarUrl')
        .populate('lastMessage')
        .exec();

      if (!conversation) {
        this.logger.warn(`Conversation ${conversationId} not found`);
        throw new NotFoundException('Conversation not found');
      }

      // Check if user is a participant
      const isParticipant = conversation.participants.some((p: any) => {
        const participantId =
          p instanceof mongoose.Types.ObjectId
            ? p.toString()
            : (p as { _id: mongoose.Types.ObjectId })._id.toString();
        return participantId === userId;
      });

      if (!isParticipant) {
        this.logger.warn(
          `User ${userId} not authorized to view conversation ${conversationId}`,
        );
        throw new UnauthorizedException(
          'You are not a participant of this conversation',
        );
      }

      this.logger.log(`Conversation ${conversationId} fetched successfully`);
      return conversation;
    } catch (error) {
      this.logger.error(
        `Error fetching conversation ${conversationId}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async createConversation(
    currentUserId: string,
    data: CreateConversationDto,
    avatarFile?: Express.Multer.File,
  ) {
    try {
      // Validate participants exist
      const participants = [...new Set([currentUserId, ...data.participants])];
      // Check if all participants exist
      const existingUsers = await this.userModel
        .find({
          _id: { $in: participants },
        })
        .select('_id');
      if (existingUsers.length !== participants.length) {
        const missing = participants.filter(
          (p) => !existingUsers.some((u) => u._id.toString() === p),
        );
        throw new NotFoundException(`Users not found: ${missing.join(', ')}`);
      }

      // Upload avatar if provided
      const avatar: {
        url?: string;
        publicId?: string;
      } = {};
      if (avatarFile) {
        const uploadResult = await this.uploadService.uploadFile(
          avatarFile,
          'image',
        );
        avatar.url = uploadResult.url;
        avatar.publicId = uploadResult.publicId;
      }

      // For private chats, we first check if conversation already exists
      if (data.type === 'private' && participants.length === 2) {
        const existingConversation = await this.conversationModel.findOne({
          type: 'private',
          participants: { $all: participants, $size: 2 },
        });

        if (existingConversation) {
          this.logger.log(
            `Existing private conversation found between ${participants.join(', ')}`,
          );
          return existingConversation;
        }
      }

      // For group chats, we validate name and participants
      if (data.type === 'group') {
        if (!data.name) {
          this.logger.warn(
            `Group name missing for conversation by user ${currentUserId}`,
          );
          throw new BadRequestException('Group name is required');
        }
        if (participants.length < 2) {
          this.logger.warn(
            `Group chat creation failed: only ${participants.length} participants`,
          );
          throw new BadRequestException(
            'Group chat must have at least 2 participants',
          );
        }
      }

      // Create conversation
      const conversation = new this.conversationModel({
        type: data.type,
        participants: participants.map((id) => new mongoose.Types.ObjectId(id)),
        name: data.name || null,
        avatarUrl: avatar.url || null,
        publicId: avatar.publicId,
        admins: [],
        owner:
          data.type === 'group'
            ? new mongoose.Types.ObjectId(currentUserId)
            : undefined,
        lastMessage: null,
        lastMessageAt: new Date(),
        createdBy: new mongoose.Types.ObjectId(currentUserId),
      });

      await conversation.save();

      this.logger.log(
        `Conversation created: type=${data.type}, id=${conversation._id}, participants=${participants.length}`,
      );

      const populatedConversation = await this.conversationModel
        .findById(conversation._id)
        .populate('participants', 'username email avatarUrl lastSeen')
        .populate('createdBy', 'username email avatarUrl')
        .exec();

      await this.invalidateConversationCacheForUsers(participants);

      this.eventEmitter.emit(ChatEvents.CONVERSATION_CREATED, {
        conversationId: conversation._id.toString(),
        participants,
        conversation: populatedConversation,
      });

      return populatedConversation;
    } catch (error) {
      this.logger.error(
        `Error creating conversation: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async addParticipants(
    currentUserId: string,
    conversationId: string,
    data: AddParticipantsDto,
  ) {
    try {
      this.logger.log(
        `User ${currentUserId} adding participants to conversation ${conversationId}`,
      );

      // Find conversation
      const conversation =
        await this.conversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      // Only group chats can have participants added
      if (conversation.type !== 'group') {
        throw new BadRequestException(
          'Cannot add participants to private chat',
        );
      }

      // Check if current user is admin
      const isAdmin = conversation.admins!.some(
        (admin) => admin.toString() === currentUserId,
      );
      if (
        !isAdmin &&
        conversation.owner?.toString() !== currentUserId.toString()
      ) {
        throw new UnauthorizedException(
          'Only owner and admins can add participants',
        );
      }

      // Validate all new users exist
      const existingParticipantIds = conversation.participants.map((p) =>
        p.toString(),
      );
      const newUserIds = data.userIds.filter(
        (id) => !existingParticipantIds.includes(id),
      );

      if (newUserIds.length === 0) {
        throw new BadRequestException('All users are already in the group');
      }

      // Check if users exist
      for (const userId of newUserIds) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
          throw new NotFoundException(`User ${userId} not found`);
        }
      }

      // Add new participants
      const newParticipants = newUserIds.map(
        (id) => new mongoose.Types.ObjectId(id),
      );

      await this.conversationModel.findByIdAndUpdate(conversationId, {
        $addToSet: { participants: { $each: newParticipants } },
        updatedAt: new Date(),
      });

      this.logger.log(
        `Added ${newUserIds.length} participants to conversation ${conversationId}`,
      );

      await this.invalidateConversationCacheForUsers(newUserIds);

      this.eventEmitter.emit(ChatEvents.PARTICIPANT_ADDED, {
        conversationId,
        newParticipants: newUserIds,
        addedBy: currentUserId,
      });

      // Return updated conversation
      return this.conversationModel
        .findById(conversationId)
        .populate('participants', 'username email avatarUrl lastSeen')
        .populate('createdBy', 'username email avatarUrl')
        .exec();
    } catch (error) {
      this.logger.error(
        `Error adding participants: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async promoteToAdmin(
    currentUserId: string,
    conversationId: string,
    targetUserId: string,
  ) {
    try {
      this.logger.log(
        `User ${currentUserId} promoting ${targetUserId} to admin in conversation ${conversationId}`,
      );

      const conversation =
        await this.conversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      // Only group chats
      if (conversation.type !== 'group') {
        throw new BadRequestException('Only group chats have admins');
      }

      // Check if target user is in the group
      const isTargetInGroup = conversation.participants.some(
        (p) => p.toString() === targetUserId,
      );
      if (!isTargetInGroup) {
        throw new BadRequestException(
          'User is not a participant of this group',
        );
      }

      // Check if already admin
      const isAlreadyAdmin = conversation.admins?.some(
        (a) => a.toString() === targetUserId,
      );
      if (isAlreadyAdmin) {
        throw new BadRequestException('User is already an admin');
      }

      // Check permissions (owner or admin can promote)
      const isOwner = conversation.owner?.toString() === currentUserId;
      const isAdmin = conversation.admins?.some(
        (a) => a.toString() === currentUserId,
      );

      if (!isOwner && !isAdmin) {
        throw new UnauthorizedException(
          'Only owner and admins can promote users to admin',
        );
      }

      // Cannot promote owner (owner is above admin)
      if (conversation.owner?.toString() === targetUserId) {
        throw new BadRequestException('Cannot promote the group owner');
      }

      // Add to admins array
      await this.conversationModel.findByIdAndUpdate(conversationId, {
        $addToSet: { admins: new mongoose.Types.ObjectId(targetUserId) },
        updatedAt: new Date(),
      });

      this.logger.log(
        `User ${targetUserId} promoted to admin in conversation ${conversationId}`,
      );

      this.eventEmitter.emit(ChatEvents.PARTICIPANT_ROLE_CHANGED, {
        conversationId,
        targetUserId,
        isPromotion: true,
        promotedBy: currentUserId,
      });

      // Return updated conversation
      return this.conversationModel
        .findById(conversationId)
        .populate('participants', 'username email avatarUrl lastSeen')
        .populate('admins', 'username email avatarUrl')
        .populate('owner', 'username email avatarUrl')
        .exec();
    } catch (error) {
      this.logger.error(
        `Error promoting to admin: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async demoteFromAdmin(
    currentUserId: string,
    conversationId: string,
    targetUserId: string,
  ) {
    try {
      this.logger.log(
        `User ${currentUserId} demoting ${targetUserId} from admin in conversation ${conversationId}`,
      );

      const conversation =
        await this.conversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      // Only group chats
      if (conversation.type !== 'group') {
        throw new BadRequestException('Only group chats have admins');
      }

      // Check if target user is in the group
      const isTargetInGroup = conversation.participants.some(
        (p) => p.toString() === targetUserId,
      );
      if (!isTargetInGroup) {
        throw new BadRequestException(
          'User is not a participant of this group',
        );
      }

      // Check if user is admin
      const isAdmin = conversation.admins?.some(
        (a) => a.toString() === targetUserId,
      );
      if (!isAdmin) {
        throw new BadRequestException('User is not an admin');
      }

      // Only owner can demote admins
      const isOwner = conversation.owner?.toString() === currentUserId;
      if (!isOwner) {
        throw new ForbiddenException('Only group owner can demote admins');
      }

      // Cannot demote owner (owner is not in admins array anyway)
      if (conversation.owner?.toString() === targetUserId) {
        throw new BadRequestException('Cannot demote the group owner');
      }

      // Remove from admins array
      await this.conversationModel.findByIdAndUpdate(conversationId, {
        $pull: { admins: new mongoose.Types.ObjectId(targetUserId) },
        updatedAt: new Date(),
      });

      this.logger.log(
        `User ${targetUserId} demoted from admin in conversation ${conversationId}`,
      );

      this.eventEmitter.emit(ChatEvents.PARTICIPANT_ROLE_CHANGED, {
        conversationId,
        targetUserId,
        isPromotion: false,
        demotedBy: currentUserId,
      });

      // Return updated conversation
      return this.conversationModel
        .findById(conversationId)
        .populate('participants', 'username email avatarUrl lastSeen')
        .populate('admins', 'username email avatarUrl')
        .populate('owner', 'username email avatarUrl')
        .exec();
    } catch (error) {
      this.logger.error(
        `Error demoting from admin: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async transferOwnership(
    currentUserId: string,
    conversationId: string,
    newOwnerId: string,
  ) {
    try {
      this.logger.log(
        `User ${currentUserId} transferring ownership of conversation ${conversationId} to ${newOwnerId}`,
      );

      const conversation =
        await this.conversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      // Only group chats
      if (conversation.type !== 'group') {
        throw new BadRequestException('Only group chats can have owners');
      }

      // Check if current user is the owner
      if (conversation.owner?.toString() !== currentUserId) {
        throw new UnauthorizedException(
          'Only the group owner can transfer ownership',
        );
      }

      // Check if new owner is in the group
      const isNewOwnerInGroup = conversation.participants.some(
        (p) => p.toString() === newOwnerId,
      );
      if (!isNewOwnerInGroup) {
        throw new BadRequestException(
          'New owner must be a participant of the group',
        );
      }

      // Cannot transfer to self
      if (currentUserId === newOwnerId) {
        throw new BadRequestException('Cannot transfer ownership to yourself');
      }

      // Transfer ownership
      await this.conversationModel.findByIdAndUpdate(conversationId, {
        owner: new mongoose.Types.ObjectId(newOwnerId),
        // Add current owner to admins if not already
        $addToSet: { admins: new mongoose.Types.ObjectId(currentUserId) },
        updatedAt: new Date(),
      });

      this.logger.log(
        `Ownership of conversation ${conversationId} transferred from ${currentUserId} to ${newOwnerId}`,
      );

      this.eventEmitter.emit(ChatEvents.OWNERSHIP_TRANSFERRED, {
        conversationId,
        newOwnerId,
        previousOwnerId: currentUserId,
      });

      // Return updated conversation
      return this.conversationModel
        .findById(conversationId)
        .populate('participants', 'username email avatarUrl lastSeen')
        .populate('admins', 'username email avatarUrl')
        .populate('owner', 'username email avatarUrl')
        .exec();
    } catch (error) {
      this.logger.error(
        `Error transferring ownership: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async sendMessage(
    senderId: string,
    data: SendMessageDto,
    file?: Express.Multer.File,
  ) {
    try {
      this.logger.log(
        `User ${senderId} sending message to conversation ${data.conversationId}`,
      );

      // Check if conversation exists and user is participant
      const conversation = await this.conversationModel.findById(
        new mongoose.Types.ObjectId(data.conversationId),
      );
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === senderId.toString(),
      );
      if (!isParticipant) {
        throw new UnauthorizedException(
          'You are not a participant of this conversation',
        );
      }

      if (data.replyTo) {
        const repliedMsg = await this.messageModel.findOne({
          _id: data.replyTo,
          conversationId: data.conversationId,
        });
        if (!repliedMsg) {
          throw new BadRequestException(
            'Invalid reply target - message not found in this conversation',
          );
        }
      }

      const otherParticipants = conversation.participants.filter(
        (p) => p.toString() !== senderId,
      );

      for (const participant of otherParticipants) {
        const blockedUsers = await this.userService.getBlockedUsers(
          participant.toString(),
        );
        if (blockedUsers.includes(senderId)) {
          throw new ForbiddenException(
            'You cannot message this user (you are blocked)',
          );
        }
      }

      let content = data.content;
      let publicId: string | undefined;

      // Handle file upload if present
      if (file && data.type !== 'text') {
        const uploadResult = await this.uploadService.uploadFile(
          file,
          data.type,
        );
        content = uploadResult.url;
        publicId = uploadResult.publicId;
      }

      // Validate text content for text messages
      if (data.type === 'text' && !content.trim()) {
        throw new BadRequestException('Text message cannot be empty');
      }

      if (data.type !== 'text' && !file) {
        throw new BadRequestException(`${data.type} message requires a file`);
      }

      // Create message
      const message = new this.messageModel({
        conversationId: data.conversationId,
        senderId,
        type: data.type,
        content,
        publicId,
        replyTo: data.replyTo || null,
        deliveredTo: [senderId],
      });

      await message.save();

      // Update conversation last message
      const lastMessageText =
        data.type === 'text'
          ? content.substring(0, 100)
          : `[${data.type}]${data.type === 'voice' ? ' 🎤' : data.type === 'image' ? ' 🖼️' : data.type === 'video' ? ' 🎥' : ' 📎'}`;

      await this.conversationModel.findByIdAndUpdate(data.conversationId, {
        lastMessage: lastMessageText,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      });

      this.logger.log(`Message sent to conversation ${data.conversationId}`);

      const populatedMessage = await this.messageModel
        .findById(message._id)
        .populate('senderId', 'username email avatarUrl')
        .populate('replyTo', 'content type senderId')
        .exec();

      const senderObj = populatedMessage?.senderId as
        | { username?: string }
        | undefined;
      const participantIds = conversation.participants.map((p) => p.toString());
      await this.invalidateConversationCacheForUsers(participantIds);
      this.eventEmitter.emit(ChatEvents.MESSAGE_SENT, {
        conversationId: data.conversationId,
        messageId: message._id.toString(),
        senderId,
        senderUsername: senderObj?.username || 'Unknown',
        type: data.type,
        content,
        participants: participantIds,
        message: populatedMessage,
      });

      return populatedMessage;
    } catch (error) {
      this.logger.error(
        `Error sending message: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async deleteMessage(userId: string, messageId: string) {
    try {
      this.logger.log(`User ${userId} deleting message ${messageId}`);

      const message = await this.messageModel.findById(messageId);
      if (!message) {
        throw new NotFoundException('Message not found');
      }

      const conversation = await this.conversationModel.findById(
        message.conversationId,
      );

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (conversation.type === 'group') {
        const isOwner = conversation.owner?.toString() === userId;
        const isAdmin = conversation.admins?.some(
          (a) => a.toString() === userId,
        );
        const isSender = message.senderId.toString() === userId;

        if (!isSender && !isAdmin && !isOwner) {
          throw new ForbiddenException(
            'You are not allowed to delete this message',
          );
        }
      }

      // Delete file from Cloudinary if exists
      if (message.publicId) {
        const resourceType = message.type === 'image' ? 'image' : 'video';
        await this.uploadService.deleteFile(message.publicId, resourceType);
      }

      // Soft delete
      message.deleted = true;
      message.content = '[Message deleted]';
      message.publicId = undefined;
      await message.save();

      this.logger.log(`Message ${messageId} deleted by user ${userId}`);

      this.eventEmitter.emit(ChatEvents.MESSAGE_DELETED, {
        conversationId: message.conversationId.toString(),
        messageId: message._id.toString(),
        deletedBy: userId,
      });

      return { message: 'Message deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting message: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async removeParticipant(
    currentUserId: string,
    conversationId: string,
    targetUserId: string,
  ) {
    try {
      this.logger.log(
        `User ${currentUserId} removing participant ${targetUserId} from conversation ${conversationId}`,
      );

      // Find conversation
      const conversation =
        await this.conversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      // Only group chats
      if (conversation.type !== 'group') {
        throw new BadRequestException(
          'Cannot remove participants from private chat',
        );
      }

      const targetUser = await this.userService.findUserById(targetUserId);
      if (!targetUser) {
        throw new NotFoundException(`target user ${targetUserId} not found`);
      }

      // Check if target user is in the group
      const isTargetInGroup = conversation.participants.some(
        (p) => p.toString() === targetUserId,
      );
      if (!isTargetInGroup) {
        throw new BadRequestException(
          'User is not a participant of this group',
        );
      }

      // Cannot remove the last participant
      if (conversation.participants.length === 1) {
        throw new BadRequestException('Cannot remove the last participant');
      }

      // Check permissions
      const isOwner = conversation.owner?.toString() === currentUserId;
      const isAdmin = conversation.admins?.some(
        (a) => a.toString() === currentUserId,
      );
      const isSelfRemove = currentUserId === targetUserId;

      if (!isSelfRemove && !isOwner && !isAdmin) {
        throw new UnauthorizedException(
          'Only owner, admins, or the user themselves can remove participants',
        );
      }

      // Owner cannot be removed by others
      if (conversation.owner?.toString() === targetUserId && !isSelfRemove) {
        throw new BadRequestException('Cannot remove the group owner');
      }

      // Owner can only leave (self-remove) if they're the last member
      if (
        isSelfRemove &&
        conversation.owner?.toString() === targetUserId &&
        conversation.participants.length > 1
      ) {
        throw new BadRequestException(
          'Owner cannot leave the group. Transfer ownership first or delete the group.',
        );
      }

      // Remove participant
      await this.conversationModel.findByIdAndUpdate(conversationId, {
        $pull: {
          participants: new mongoose.Types.ObjectId(targetUserId),
          admins: new mongoose.Types.ObjectId(targetUserId),
        },
        updatedAt: new Date(),
      });

      this.logger.log(
        `User ${targetUserId} removed from conversation ${conversationId}`,
      );

      await this.invalidateConversationCache(targetUserId);
      await this.invalidateConversationCache(currentUserId);

      this.eventEmitter.emit(ChatEvents.PARTICIPANT_REMOVED, {
        conversationId,
        removedUserId: targetUserId,
        removedBy: currentUserId,
      });

      // Return updated conversation
      return this.conversationModel
        .findById(conversationId)
        .populate('participants', 'username email avatarUrl lastSeen')
        .populate('createdBy', 'username email avatarUrl')
        .exec();
    } catch (error) {
      this.logger.error(
        `Error removing participant: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async updateConversation(
    currentUserId: string,
    conversationId: string,
    data: UpdateConversationDto,
    avatarFile?: Express.Multer.File,
  ) {
    try {
      this.logger.log(
        `User ${currentUserId} updating conversation ${conversationId}`,
      );

      const conversation =
        await this.conversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      // Only group chats can be updated
      if (conversation.type !== 'group') {
        throw new BadRequestException('Only group chats can be updated');
      }

      // Check if user is owner
      if (conversation.owner?.toString() !== currentUserId) {
        throw new UnauthorizedException(
          'Only group owner can update conversation details',
        );
      }

      const updateData: {
        name?: string;
        avatarUrl?: string;
        publicId?: string;
        updatedAt: Date;
      } = { updatedAt: new Date() };

      // Update name if provided
      if (data.name) {
        updateData.name = data.name;
      }

      // Handle avatar upload
      if (avatarFile) {
        // Delete old avatar from Cloudinary if exists
        if (conversation.publicId) {
          await this.uploadService.deleteFile(conversation.publicId, 'image');
        }

        const uploadResult = await this.uploadService.uploadFile(
          avatarFile,
          'image',
        );
        updateData.avatarUrl = uploadResult.url;
        updateData.publicId = uploadResult.publicId;
      }

      if (Object.keys(updateData).length === 1) {
        throw new BadRequestException('No changes detected');
      }

      const updatedConversation = await this.conversationModel
        .findByIdAndUpdate(conversationId, updateData, {
          returnDocument: 'after',
        })
        .populate('participants', 'username email avatarUrl lastSeen')
        .populate('createdBy', 'username email avatarUrl')
        .exec();

      this.logger.log(`Conversation ${conversationId} updated successfully`);

      const updateParticipants = conversation.participants.map((p) =>
        p.toString(),
      );
      await this.invalidateConversationCacheForUsers(updateParticipants);

      this.eventEmitter.emit(ChatEvents.CONVERSATION_UPDATED, {
        conversationId,
        updatedBy: currentUserId,
      });

      return updatedConversation;
    } catch (error) {
      this.logger.error(
        `Error updating conversation: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async editMessage(userId: string, messageId: string, data: EditMessageDto) {
    try {
      this.logger.log(`User ${userId} editing message ${messageId}`);

      const message = await this.messageModel.findById(messageId);
      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // Check if user is the sender
      if (message.senderId.toString() !== userId) {
        throw new UnauthorizedException('You can only edit your own messages');
      }

      // Check if message is already deleted
      if (message.deleted) {
        throw new BadRequestException('Cannot edit a deleted message');
      }

      // For text messages, validate content
      if (message.type === 'text' && !data.content.trim()) {
        throw new BadRequestException('Message content cannot be empty');
      }

      // For media messages, cannot edit content (only text)
      if (message.type !== 'text') {
        throw new BadRequestException('Only text messages can be edited');
      }

      // Update message
      message.content = data.content;
      message.edited = true;
      message.updatedAt = new Date();
      await message.save();

      this.logger.log(`Message ${messageId} edited by user ${userId}`);

      const updatedMessage = await this.messageModel
        .findById(messageId)
        .populate('senderId', 'username email avatarUrl')
        .exec();

      this.eventEmitter.emit(ChatEvents.MESSAGE_EDITED, {
        conversationId: message.conversationId.toString(),
        messageId: message._id.toString(),
        senderId: userId,
        content: data.content,
        message: updatedMessage,
      });

      return updatedMessage;
    } catch (error) {
      this.logger.error(
        `Error editing message: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async deleteConversation(currentUserId: string, conversationId: string) {
    try {
      this.logger.log(
        `User ${currentUserId} deleting conversation ${conversationId}`,
      );

      const conversation =
        await this.conversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (conversation.type !== 'group') {
        throw new BadRequestException('Only group chats can be deleted');
      }

      if (conversation.owner?.toString() !== currentUserId) {
        throw new UnauthorizedException(
          'Only the group owner can delete this group',
        );
      }

      // Delete files from Cloudinary (outside transaction)
      const messages = await this.messageModel.find({ conversationId });
      for (const message of messages) {
        if (message.publicId) {
          const resourceType = message.type === 'image' ? 'image' : 'video';
          await this.uploadService.deleteFile(message.publicId, resourceType);
        }
      }

      if (conversation.publicId) {
        await this.uploadService.deleteFile(conversation.publicId, 'image');
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await this.messageModel.deleteMany({ conversationId }).session(session);
        await this.conversationModel
          .findByIdAndDelete(conversationId)
          .session(session);
        await session.commitTransaction();

        this.logger.log(
          `Conversation ${conversationId} deleted by user ${currentUserId}`,
        );

        const deleteParticipants = conversation.participants.map((p) =>
          p.toString(),
        );
        await this.invalidateConversationCacheForUsers(deleteParticipants);

        this.eventEmitter.emit(ChatEvents.CONVERSATION_DELETED, {
          conversationId,
          deletedBy: currentUserId,
        });
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        await session.endSession();
      }

      return { message: 'Group deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting conversation: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async getUnreadCounts(userId: string): Promise<Record<string, number>> {
    try {
      const conversations = await this.conversationModel
        .find({ participants: userId })
        .select('_id')
        .lean();

      const conversationIds = conversations.map((c) => c._id.toString());

      const counts = await this.messageModel.aggregate([
        {
          $match: {
            conversationId: {
              $in: conversationIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
            senderId: { $ne: new mongoose.Types.ObjectId(userId) },
            deliveredTo: { $ne: new mongoose.Types.ObjectId(userId) },
          },
        },
        { $group: { _id: '$conversationId', count: { $sum: 1 } } },
      ]);

      const result: Record<string, number> = {};
      for (const id of conversationIds) {
        result[id] = 0;
      }
      for (const c of counts) {
        result[c._id.toString()] = c.count;
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting unread counts: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}
