import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { UpdateUserDto } from 'src/common/dtos/users/update-user.dto';
import { UserDocument } from 'src/common/schemas/user.schema';

@Injectable()
export class UserService {
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

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  findUserById(id: string): Promise<UserDocument | null> {
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
    const newUser = new this.userModel(data);
    return newUser.save();
  }

  async updateUser(
    id: string,
    data: UpdateUserDto,
  ): Promise<Omit<UserDocument, 'password'>> {
    // Check if user exists
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for duplicate email (if email is being updated)
    if (data.email && data.email !== user.email) {
      const existingUser = await this.userModel.findOne({
        email: data.email,
        _id: { $ne: id },
      });
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Check for duplicate username (if username is being updated)
    if (data.username && data.username !== user.username) {
      const existingUser = await this.userModel.findOne({
        username: data.username,
        _id: { $ne: id },
      });
      if (existingUser) {
        throw new BadRequestException('Username already taken');
      }
    }

    // Remove undefined values and prevent no-change updates
    const updateData: UpdateUserDto & { updatedAt?: Date } = {};
    if (data.username && data.username !== user.username)
      updateData.username = data.username;
    if (data.email && data.email !== user.email) updateData.email = data.email;
    if (data.bio !== undefined && data.bio !== user.bio)
      updateData.bio = data.bio;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No changes detected');
    }

    updateData.updatedAt = new Date();

    // Update user
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .select('-password -__v')
      .populate('blockedUsers', 'username email avatarUrl');

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    const user = await this.userModel.findOne({ username });
    return !!user;
  }
}
