import mongoose, { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type DeviceTokenDocument = HydratedDocument<DeviceToken>;

export type DevicePlatform = 'ios' | 'android';

@Schema({
  timestamps: true,
  collection: 'device_tokens',
})
export class DeviceToken {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  userId: string;

  @Prop({
    required: true,
    type: String,
    trim: true,
  })
  token: string;

  @Prop({
    required: true,
    type: String,
    enum: ['ios', 'android'],
  })
  platform: DevicePlatform;

  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  deviceName?: string;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  lastUsedAt: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);

DeviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });
DeviceTokenSchema.index({ token: 1 }, { unique: true });
DeviceTokenSchema.index({ lastUsedAt: 1 }, { expireAfterSeconds: 7776000 });
