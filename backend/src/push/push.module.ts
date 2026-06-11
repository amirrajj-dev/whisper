import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { DeviceTokenSchema } from 'src/common/schemas/device-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'DeviceToken', schema: DeviceTokenSchema },
    ]),
  ],
  controllers: [PushController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
