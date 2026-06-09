import mongoose, { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type BlockRecordDocument = HydratedDocument<BlockRecordModel>;

@Schema({
  timestamps: true,
  collection: 'block_records',
})
export class BlockRecordModel {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  blockerId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  blockedId: mongoose.Types.ObjectId;
}

export const BlockRecordSchema = SchemaFactory.createForClass(BlockRecordModel);

BlockRecordSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });
BlockRecordSchema.index({ blockerId: 1, createdAt: -1 });
