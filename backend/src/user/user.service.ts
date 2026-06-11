import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import mongoose, { Model } from 'mongoose';
import { UpdateUserDto } from 'src/common/dtos/users/update-user.dto';
import { ChatEvents } from 'src/common/constants/events.constants';
import { UserDocument } from 'src/common/schemas/user.schema';
import { ConversationDocument } from 'src/common/schemas/conversation.schema';
import { MessageDocument } from 'src/common/schemas/message.schema';
import { NotificationDocument } from 'src/common/schemas/notification.schema';
import { RefreshTokenDocument } from 'src/common/schemas/refresh-token.schema';
import { BlockRecordDocument } from 'src/common/schemas/block-record.schema';
import { DeviceTokenDocument } from 'src/common/schemas/device-token.schema';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Conversation')
    private conversationModel: Model<ConversationDocument>,
    @InjectModel('Message') private messageModel: Model<MessageDocument>,
    @InjectModel('Notification')
    private notificationModel: Model<NotificationDocument>,
    @InjectModel('RefreshToken')
    private refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel('BlockRecord')
    private blockRecordModel: Model<BlockRecordDocument>,
    @InjectModel('DeviceToken')
    private deviceTokenModel: Model<DeviceTokenDocument>,
    private readonly uploadService: UploadService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getUsers(
    currentUserId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    users: Omit<UserDocument, 'password'>[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const cacheKey = `users:${currentUserId}:${page}:${limit}`;
    try {
      const cached = await this.cacheManager.get<{
        users: Omit<UserDocument, 'password'>[];
        total: number;
        page: number;
        totalPages: number;
      }>(cacheKey);
      if (cached) return cached;
    } catch {
      this.logger.warn('Cache unavailable, falling through to DB');
    }

    try {
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        this.userModel
          .find({
            _id: { $ne: currentUserId },
            isDeleted: { $ne: true },
          })
          .select('-password -__v')
          .populate('blockedUsers', 'username email avatarUrl isDeleted')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.userModel.countDocuments({ _id: { $ne: currentUserId } }),
      ]);

      this.logger.log(
        `Fetched ${users.length} users (page ${page}, limit ${limit})`,
      );

      const result = {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };

      try {
        await this.cacheManager.set(cacheKey, result, 1000 * 60 * 2);
      } catch {
        this.logger.warn('Failed to set cache, non-critical');
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching users: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  findUserByEmail(email: string): Promise<UserDocument | null> {
    this.logger.debug(`Finding user by email: ${email}`);
    return this.userModel.findOne({ email }).exec();
  }

  async findUserById(
    id: string,
  ): Promise<Omit<UserDocument, 'password'> | null> {
    const cacheKey = `user:${id}`;
    try {
      const cached = await this.cacheManager.get<Omit<
        UserDocument,
        'password'
      > | null>(cacheKey);
      if (cached !== undefined) return cached;
    } catch {
      this.logger.warn('Cache unavailable, falling through to DB');
    }

    this.logger.debug(`Finding user by id: ${id}`);
    const objectId = new mongoose.Types.ObjectId(id);
    const user = await this.userModel
      .findById(objectId, '-password -__v')
      .populate('blockedUsers', 'username email avatarUrl isDeleted')
      .exec();

    if (user) {
      try {
        await this.cacheManager.set(
          cacheKey,
          user.toObject({ virtuals: true }),
          1000 * 60 * 5,
        );
      } catch {
        this.logger.warn('Failed to set cache, non-critical');
      }
    }
    return user;
  }

  createUser(data: {
    email: string;
    password: string;
    username: string;
  }): Promise<UserDocument> {
    this.logger.log(`Creating user: ${data.email}`);
    const newUser = new this.userModel(data);
    return newUser.save();
  }

  async updateUser(
    id: string,
    data: UpdateUserDto,
    avatarFile?: Express.Multer.File,
  ): Promise<Omit<UserDocument, 'password'>> {
    try {
      this.logger.log(`Updating user: ${id}`);

      // Check if user exists
      const user = await this.findUserById(id);
      if (!user) {
        this.logger.warn(`User not found: ${id}`);
        throw new NotFoundException('User not found');
      }

      // Check for duplicate email (if email is being updated)
      if (data.email && data.email !== user.email) {
        this.logger.debug(`Checking email uniqueness: ${data.email}`);
        const existingUser = await this.userModel.findOne({
          email: data.email,
          _id: { $ne: id },
        });
        if (existingUser) {
          this.logger.warn(`Email already in use: ${data.email}`);
          throw new BadRequestException('Email already in use');
        }
      }

      // Check for duplicate username (if username is being updated)
      if (data.username && data.username !== user.username) {
        this.logger.debug(`Checking username uniqueness: ${data.username}`);
        const existingUser = await this.userModel.findOne({
          username: data.username,
          _id: { $ne: id },
        });
        if (existingUser) {
          this.logger.warn(`Username already taken: ${data.username}`);
          throw new BadRequestException('Username already taken');
        }
      }

      // Handle avatar upload
      let avatarUrl = user.avatarUrl;
      let publicId = user.publicId;

      if (avatarFile) {
        // Delete old avatar from Cloudinary if exists
        if (publicId) {
          await this.uploadService.deleteFile(publicId, 'image');
        }

        const uploadResult = await this.uploadService.uploadFile(
          avatarFile,
          'image',
        );
        avatarUrl = uploadResult.url;
        publicId = uploadResult.publicId;
      }

      // Build update data
      const updateData: {
        username?: string;
        email?: string;
        bio?: string;
        avatarUrl?: string;
        publicId?: string;
        updatedAt: Date;
      } = { updatedAt: new Date() };
      if (data.username && data.username !== user.username)
        updateData.username = data.username;
      if (data.email && data.email !== user.email)
        updateData.email = data.email;
      if (data.bio !== undefined && data.bio !== user.bio)
        updateData.bio = data.bio;
      if (avatarFile) {
        updateData.avatarUrl = avatarUrl;
        updateData.publicId = publicId;
      }

      if (Object.keys(updateData).length === 1) {
        this.logger.warn(`No changes detected for user: ${id}`);
        throw new BadRequestException('No changes detected');
      }

      // Update user
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
        .select('-password -__v')
        .populate('blockedUsers', 'username email avatarUrl isDeleted');

      if (!updatedUser) {
        this.logger.error(`User not found after update: ${id}`);
        throw new NotFoundException('User not found');
      }

      try {
        await this.cacheManager.del(`user:${id}`);
      } catch {
        this.logger.warn('Failed to invalidate cache, non-critical');
      }

      this.logger.log(`User updated successfully: ${id}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Error updating user ${id}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    this.logger.debug(`Checking if username is taken: ${username}`);
    const user = await this.userModel.findOne({ username });
    const taken = !!user;
    if (taken) {
      this.logger.debug(`Username already taken: ${username}`);
    }
    return taken;
  }

  async getBlockedUsers(userId: string): Promise<string[]> {
    const cacheKey = `blocked:${userId}`;
    try {
      const cached = await this.cacheManager.get<string[]>(cacheKey);
      if (cached) return cached;
    } catch {
      this.logger.warn('Cache unavailable, falling through to DB');
    }

    const user = await this.userModel
      .findById(userId)
      .select('blockedUsers')
      .exec();
    const blockedUsers = user?.blockedUsers?.map((id) => id.toString()) || [];

    try {
      await this.cacheManager.set(cacheKey, blockedUsers, 1000 * 60 * 2);
    } catch {
      this.logger.warn('Failed to set cache, non-critical');
    }
    return blockedUsers;
  }

  async getBlockedUsersDetails(userId: string) {
    try {
      const records = await this.blockRecordModel
        .find({ blockerId: userId as any })
        .sort({ createdAt: -1 })
        .populate(
          'blockedId',
          'username email avatarUrl bio lastSeen isDeleted',
        )
        .exec();

      return records
        .filter((r) => r.blockedId)
        .map((r) => ({
          _id: ((r.blockedId as any)._id || r.blockedId).toString(),
          username: (r.blockedId as any).username,
          email: (r.blockedId as any).email,
          avatarUrl: (r.blockedId as any).avatarUrl,
          bio: (r.blockedId as any).bio,
          lastSeen: (r.blockedId as any).lastSeen,
          isDeleted: (r.blockedId as any).isDeleted,
          blockedAt: (r as any).createdAt,
        }));
    } catch (error) {
      this.logger.error(
        `Error fetching blocked users details: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async blockUser(currentUserId: string, targetUserId: string) {
    try {
      this.logger.log(`User ${currentUserId} blocking user ${targetUserId}`);

      // Check if trying to block self
      if (currentUserId === targetUserId) {
        throw new BadRequestException('You cannot block yourself');
      }

      // Check if target user exists
      const targetUser = await this.findUserById(targetUserId);
      if (!targetUser) {
        throw new NotFoundException('User to block not found');
      }

      // Get current user
      const currentUser = await this.userModel.findById(currentUserId);
      if (!currentUser) {
        throw new NotFoundException('Current user not found');
      }

      // Check if already blocked
      if (currentUser.blockedUsers.includes(targetUserId)) {
        throw new BadRequestException('User is already blocked');
      }

      // Add to blocked users
      await this.userModel.findByIdAndUpdate(currentUserId, {
        $addToSet: { blockedUsers: new mongoose.Types.ObjectId(targetUserId) },
        updatedAt: new Date(),
      });

      await this.blockRecordModel.create({
        blockerId: currentUserId as any,
        blockedId: targetUserId as any,
      });

      try {
        await this.cacheManager.del(`blocked:${currentUserId}`);
      } catch {
        this.logger.warn('Failed to invalidate cache, non-critical');
      }

      this.logger.log(`User ${currentUserId} blocked ${targetUserId}`);

      return { message: 'User blocked successfully' };
    } catch (error) {
      this.logger.error(
        `Error blocking user: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async unblockUser(currentUserId: string, targetUserId: string) {
    try {
      this.logger.log(`User ${currentUserId} unblocking user ${targetUserId}`);

      const currentUser = await this.userModel.findById(currentUserId);
      if (!currentUser) {
        throw new NotFoundException('Current user not found');
      }

      if (!currentUser.blockedUsers.includes(targetUserId)) {
        throw new BadRequestException('User is not blocked');
      }

      await this.userModel.findByIdAndUpdate(currentUserId, {
        $pull: { blockedUsers: new mongoose.Types.ObjectId(targetUserId) },
        updatedAt: new Date(),
      });

      await this.blockRecordModel.deleteOne({
        blockerId: currentUserId,
        blockedId: targetUserId,
      });

      try {
        await this.cacheManager.del(`blocked:${currentUserId}`);
      } catch {
        this.logger.warn('Failed to invalidate cache, non-critical');
      }

      this.logger.log(`User ${currentUserId} unblocked ${targetUserId}`);

      return { message: 'User unblocked successfully' };
    } catch (error) {
      this.logger.error(
        `Error unblocking user: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  private getResourceType(messageType: string): 'image' | 'raw' | 'video' {
    if (messageType === 'image') return 'image';
    if (messageType === 'video' || messageType === 'voice') return 'video';
    if (messageType === 'file') return 'raw';
    return 'image';
  }

  async deleteAccount(
    userId: string,
    password: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Account deletion requested for user: ${userId}`);

    // Find user and verify password
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    // Delete avatar from Cloudinary if exists
    if (user.publicId) {
      try {
        await this.uploadService.deleteFile(user.publicId, 'image');
      } catch (err) {
        this.logger.warn(
          `Failed to delete avatar from Cloudinary: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    const objectId = new mongoose.Types.ObjectId(userId);

    // Collect all conversations the user is in (before any modifications)
    const allConversations = await this.conversationModel
      .find({ participants: userId })
      .exec();

    const privateConversations = allConversations.filter(
      (c) => c.type === 'private',
    );
    const groupConversations = allConversations.filter(
      (c) => c.type === 'group',
    );

    // Handle groups where user is the owner — transfer ownership
    const ownedGroups = groupConversations.filter(
      (g) => g.owner?.toString() === userId,
    );

    for (const group of ownedGroups) {
      const otherParticipants = group.participants.filter(
        (p) => p.toString() !== userId,
      );

      if (otherParticipants.length === 0) {
        // No other participants — delete the group entirely
        const messages = await this.messageModel
          .find({ conversationId: group._id })
          .exec();
        for (const message of messages) {
          if (message.publicId) {
            try {
              await this.uploadService.deleteFile(
                message.publicId,
                this.getResourceType(message.type),
              );
            } catch {
              // best-effort
            }
          }
        }
        await this.messageModel
          .deleteMany({ conversationId: group._id })
          .exec();
        await this.conversationModel.findByIdAndDelete(group._id).exec();
      } else {
        // Transfer ownership to the first remaining participant
        await this.conversationModel
          .findByIdAndUpdate(group._id, {
            owner: otherParticipants[0],
            updatedAt: new Date(),
          })
          .exec();
      }
    }

    // ----- PRIVATE CONVERSATIONS: delete entirely -----
    for (const conv of privateConversations) {
      const msgs = await this.messageModel
        .find({ conversationId: conv._id })
        .exec();
      for (const msg of msgs) {
        if (msg.publicId) {
          try {
            await this.uploadService.deleteFile(
              msg.publicId,
              this.getResourceType(msg.type),
            );
          } catch {
            // best-effort
          }
        }
      }
      await this.messageModel.deleteMany({ conversationId: conv._id }).exec();
      await this.conversationModel.findByIdAndDelete(conv._id).exec();

      // Emit conversation:deleted so other participants remove it in real-time
      this.eventEmitter.emit(ChatEvents.CONVERSATION_DELETED, {
        conversationId: conv._id.toString(),
        deletedBy: userId,
      });
    }

    // ----- GROUP CONVERSATIONS: soft-delete user's messages, then remove user -----
    const userMessages = await this.messageModel
      .find({ senderId: userId })
      .exec();

    // Soft-delete only messages in group conversations
    const groupConvIds = new Set(
      groupConversations.map((c) => c._id.toString()),
    );
    const userGroupMessages = userMessages.filter((m) =>
      groupConvIds.has(m.conversationId.toString()),
    );

    for (const message of userGroupMessages) {
      if (message.publicId) {
        try {
          await this.uploadService.deleteFile(
            message.publicId,
            this.getResourceType(message.type),
          );
        } catch {
          // best-effort
        }
      }
      message.deleted = true;
      message.content = '[Account deleted]';
      message.publicId = undefined;
      await message.save();
    }

    // Remove user from group participants and admins
    if (groupConversations.length > 0) {
      await this.conversationModel
        .updateMany(
          { _id: { $in: groupConversations.map((c) => c._id) } },
          {
            $pull: {
              participants: objectId,
              admins: objectId,
            },
          },
        )
        .exec();

      // Update lastMessage on each group
      for (const conv of groupConversations) {
        const latestMessage = await this.messageModel
          .findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .select('content type deleted createdAt')
          .exec();

        const updateData: Record<string, unknown> = { updatedAt: new Date() };

        if (latestMessage) {
          if (latestMessage.deleted) {
            updateData.lastMessage = '[Message deleted]';
          }
          updateData.lastMessageAt = latestMessage.createdAt;
        } else {
          updateData.lastMessage = null;
          updateData.lastMessageAt = null;
        }

        await this.conversationModel
          .findByIdAndUpdate(conv._id, updateData)
          .exec();
      }

      // Emit participant:removed so remaining members update in real-time
      for (const conv of groupConversations) {
        this.eventEmitter.emit(ChatEvents.PARTICIPANT_REMOVED, {
          conversationId: conv._id.toString(),
          removedUserId: userId,
          removedBy: userId,
        });
      }
    }

    // ----- GENERAL CLEANUP -----
    await this.messageModel
      .updateMany({ deliveredTo: userId }, { $pull: { deliveredTo: userId } })
      .exec();
    await this.messageModel
      .updateMany({ readBy: userId }, { $pull: { readBy: userId } })
      .exec();

    await this.notificationModel.deleteMany({ userId }).exec();
    await this.refreshTokenModel.deleteMany({ userId }).exec();
    await this.deviceTokenModel.deleteMany({ userId }).exec();

    // Remove user from admins in any remaining conversations
    await this.conversationModel
      .updateMany({ admins: userId }, { $pull: { admins: objectId } })
      .exec();

    // Soft-delete the user record
    const uniqueSuffix = `${userId}_${Date.now()}`;
    await this.userModel
      .findByIdAndUpdate(userId, {
        $set: {
          isDeleted: true,
          username: `deleted_${uniqueSuffix}`,
          email: `deleted_${uniqueSuffix}@deleted.local`,
          password: '',
          bio: undefined,
          avatarUrl: undefined,
          publicId: undefined,
          blockedUsers: [],
          updatedAt: new Date(),
        },
      })
      .exec();

    // Invalidate conversation caches for all affected participants
    const affectedParticipantIds = new Set<string>();
    for (const conv of allConversations) {
      for (const p of conv.participants) {
        const pid = p.toString();
        if (pid !== userId) {
          affectedParticipantIds.add(pid);
        }
      }
    }
    for (const pid of affectedParticipantIds) {
      try {
        const verKey = `conv_ver:${pid}`;
        const ver = (await this.cacheManager.get<number>(verKey)) || 0;
        await this.cacheManager.set(verKey, ver + 1, 1000 * 60 * 5);
      } catch {
        this.logger.warn(
          `Failed to invalidate conversation cache for user ${pid}`,
        );
      }
    }

    try {
      await this.cacheManager.del(`user:${userId}`);
    } catch {
      this.logger.warn('Failed to invalidate user cache');
    }
    try {
      await this.cacheManager.del(`blocked:${userId}`);
    } catch {
      this.logger.warn('Failed to invalidate blocked cache');
    }

    this.logger.log(`Account deleted successfully for user: ${userId}`);
    return { message: 'Account deleted successfully' };
  }
}
