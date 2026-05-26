import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/common/schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

  findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  findUserById(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findById(id, '-password -__v')
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
}
