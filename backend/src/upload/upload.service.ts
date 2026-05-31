import { Injectable } from '@nestjs/common';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

@Injectable()
export class UploadService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadFile(
    file: Express.Multer.File,
    type: 'image' | 'file' | 'voice' | 'video',
  ) {
    return this.cloudinaryService.uploadFile(file, type);
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    type: 'image' | 'file' | 'voice' | 'video',
  ) {
    return this.cloudinaryService.uploadMultipleFiles(files, type);
  }

  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ) {
    return this.cloudinaryService.deleteCloudinaryFile(publicId, resourceType);
  }
}
