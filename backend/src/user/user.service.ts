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
import mongoose, { Model } from 'mongoose';
import { UpdateUserDto } from 'src/common/dtos/users/update-user.dto';
import { UserDocument } from 'src/common/schemas/user.schema';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel('User') private userModel: Model<UserDocument>,
    private readonly uploadService: UploadService,
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
          .find({ _id: { $ne: currentUserId } })
          .select('-password -__v')
          .populate('blockedUsers', 'username email avatarUrl')
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
      .populate('blockedUsers', 'username email avatarUrl')
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
        .populate('blockedUsers', 'username email avatarUrl');

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
}
