import mongoose, { HydratedDocument } from 'mongoose';
import { Notification, NotificationType } from '../types/notification.type';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type NotifcationDocument = HydratedDocument<Notification>;

@Schema({
  timestamps: true,
  collection: 'notifications',
})
export class NotificationModel {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: string;
  @Prop({
    required: true,
    enum: [
      'message',
      'friend_request',
      'mention',
      'reply',
      'reaction',
      'system',
    ],
    type: String,
  })
  type: NotificationType;
  @Prop({ type: String, required: false })
  relatedConversation?: string;
  @Prop({ type: String, required: false, trim: true })
  message: string;
  @Prop({ type: Boolean, default: false })
  isRead: boolean;
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const NotificationSchema =
  SchemaFactory.createForClass(NotificationModel);
