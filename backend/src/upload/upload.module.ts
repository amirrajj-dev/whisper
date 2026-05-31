import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

@Module({
  providers: [UploadService, CloudinaryService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}
