import mongoose, { HydratedDocument } from 'mongoose';
import { User as UserType } from '../types/user.type';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type UserDocument = HydratedDocument<UserType>;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class UserModel {
  @Prop({ required: true, unique: true, type: String, trim: true })
  username: string;
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    type: String,
  })
  email: string;
  @Prop({
    required: true,
    trim: true,
    type: String,
  })
  password: string;
  @Prop({
    type: String,
    required: false,
    trim: true,
    maxlength: 160,
  })
  bio?: string;
  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  avatarUrl?: string;
  @Prop({
    required: true,
    default: [],
    ref: 'User',
    type: [mongoose.Schema.Types.ObjectId],
  })
  blockedUsers: string[];
  @Prop({
    type: String,
    required: false,
  })
  publicId?: string; // Cloudinary public ID for file deletion
  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  lastSeen: Date;
  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  createdAt: Date;
  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
