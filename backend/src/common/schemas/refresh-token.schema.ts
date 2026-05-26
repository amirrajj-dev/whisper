import mongoose, { HydratedDocument } from 'mongoose';
import { RefreshToken } from '../types/refresh-token.type';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema({
  timestamps: true,
  collection: 'refresh_tokens',
})
export class RefreshTokenModel {
  @Prop({
    required: true,
    index: true,
    ref: 'User',
    type: mongoose.Schema.Types.ObjectId,
  })
  userId: string;
  @Prop({ required: true, type: String, trim: true })
  tokenHash: string;
  @Prop({ required: true, type: Date })
  expiresAt: Date;
  @Prop({ required: true, type: Date, default: Date.now })
  createdAt: Date;
  @Prop({ required: true, type: Date, default: Date.now })
  updatedAt: Date;
}

export const RefreshTokenSchema =
  SchemaFactory.createForClass(RefreshTokenModel);
