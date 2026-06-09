import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { UserSchema } from 'src/common/schemas/user.schema';
import { AuthModule } from 'src/auth/auth.module';
import { UploadModule } from 'src/upload/upload.module';
import { RestrictEmailDomainPipe } from 'src/common/pipes/restrict-email-domain.pipe';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    forwardRef(() => AuthModule),
    UploadModule,
  ],
  controllers: [UserController],
  providers: [UserService, RestrictEmailDomainPipe],
  exports: [UserService],
})
export class UserModule {}
