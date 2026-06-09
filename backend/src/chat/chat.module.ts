import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationSchema } from 'src/common/schemas/conversation.schema';
import { UserModule } from 'src/user/user.module';
import { MessageSchema } from 'src/common/schemas/message.schema';
import { UploadModule } from 'src/upload/upload.module';
import { UserSchema } from 'src/common/schemas/user.schema';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Conversation', schema: ConversationSchema },
      { name: 'Message', schema: MessageSchema },
      { name: 'User', schema: UserSchema },
    ]),
    UserModule,
    UploadModule,
    NotificationModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
