import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewayService } from './gateway.service';
import { ChatGateway } from './chat.gateway';
import { GatewayController } from './gateway.controller';
import { ConversationSchema } from '../common/schemas/conversation.schema';
import { UserSchema } from '../common/schemas/user.schema';
import { MessageSchema } from 'src/common/schemas/message.schema';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        expiresIn: config.get<string>('ACCESS_TOKEN_EXPIRES_IN', '15m'),
      }),
    }),
    MongooseModule.forFeature([
      { name: 'Conversation', schema: ConversationSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Message', schema: MessageSchema },
    ]),
  ],
  controllers: [GatewayController],
  providers: [GatewayService, ChatGateway],
  exports: [GatewayService],
})
export class GatewayModule {}
