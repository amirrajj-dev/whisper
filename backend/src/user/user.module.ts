import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { UserSchema } from 'src/common/schemas/user.schema';
import { ConversationSchema } from 'src/common/schemas/conversation.schema';
import { MessageSchema } from 'src/common/schemas/message.schema';
import { NotificationSchema } from 'src/common/schemas/notification.schema';
import { RefreshTokenSchema } from 'src/common/schemas/refresh-token.schema';
import { BlockRecordSchema } from 'src/common/schemas/block-record.schema';
import { AuthModule } from 'src/auth/auth.module';
import { UploadModule } from 'src/upload/upload.module';
import { RestrictEmailDomainPipe } from 'src/common/pipes/restrict-email-domain.pipe';
import { DeviceTokenSchema } from 'src/common/schemas/device-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Conversation', schema: ConversationSchema },
      { name: 'Message', schema: MessageSchema },
      { name: 'Notification', schema: NotificationSchema },
      { name: 'RefreshToken', schema: RefreshTokenSchema },
      { name: 'BlockRecord', schema: BlockRecordSchema },
      { name: 'DeviceToken', schema: DeviceTokenSchema },
    ]),
    forwardRef(() => AuthModule),
    UploadModule,
  ],
  controllers: [UserController],
  providers: [UserService, RestrictEmailDomainPipe],
  exports: [UserService],
})
export class UserModule {}
