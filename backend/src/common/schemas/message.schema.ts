import mongoose, { HydratedDocument } from 'mongoose';
import { Message, MessageType } from '../types/message.type';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({
  timestamps: true,
  collection: 'messages',
})
export class MessageModel {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: 'Conversation',
  })
  conversationId: string;
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: 'User',
  })
  senderId: string;
  @Prop({
    required: true,
    type: String,
    enum: ['text', 'image', 'file', 'voice', 'video'],
  })
  type: MessageType;
  @Prop({
    required: true,
    type: String,
  })
  content: string;
  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  edited: boolean;
  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  deleted: boolean;
  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    required: true,
    default: [],
    ref: 'User',
  })
  deliveredTo: string[];
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

export const MessageSchema = SchemaFactory.createForClass(MessageModel);
