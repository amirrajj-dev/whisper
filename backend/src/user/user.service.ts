import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { UpdateUserDto } from 'src/common/dtos/users/update-user.dto';
import { UserDocument } from 'src/common/schemas/user.schema';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

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

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
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

  findUserById(id: string): Promise<UserDocument | null> {
    this.logger.debug(`Finding user by id: ${id}`);
    const objectId = new mongoose.Types.ObjectId(id);
    return this.userModel
      .findById(objectId, '-password -__v')
      .populate('blockedUsers', 'username email avatarUrl')
      .exec();
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

      // Remove undefined values and prevent no-change updates
      const updateData: UpdateUserDto & { updatedAt?: Date } = {};
      if (data.username && data.username !== user.username)
        updateData.username = data.username;
      if (data.email && data.email !== user.email)
        updateData.email = data.email;
      if (data.bio !== undefined && data.bio !== user.bio)
        updateData.bio = data.bio;

      if (Object.keys(updateData).length === 0) {
        this.logger.warn(`No changes detected for user: ${id}`);
        throw new BadRequestException('No changes detected');
      }

      updateData.updatedAt = new Date();

      // Update user
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
        .select('-password -__v')
        .populate('blockedUsers', 'username email avatarUrl');

      if (!updatedUser) {
        this.logger.error(`User not found after update: ${id}`);
        throw new NotFoundException('User not found');
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
    const user = await this.userModel
      .findById(userId)
      .select('blockedUsers')
      .exec();
    return user?.blockedUsers || [];
  }
}
