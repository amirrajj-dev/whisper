import mongoose, { HydratedDocument } from 'mongoose';
import { Conversation, ConversationType } from '../types/conversation.type';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({
  timestamps: true,
  collection: 'conversations',
})
export class ConversationModel {
  @Prop({ required: true, enum: ['private', 'group'], type: String })
  type: ConversationType;
  @Prop({
    required: true,
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
    ref: 'User',
  })
  participants: string[];
  @Prop({ type: String, trim: true, required: false })
  name?: string;
  @Prop({ type: String, trim: true, required: false })
  avatarUrl?: string;
  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
    ref: 'User',
    required: true,
  })
  admins: string[];
  @Prop({ type: String, trim: true, required: false })
  lastMessage?: string;
  @Prop({ type: Date, required: true })
  lastMessageAt: Date;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy: string;
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ConversationSchema =
  SchemaFactory.createForClass(ConversationModel);
