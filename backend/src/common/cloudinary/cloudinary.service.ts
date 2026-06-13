import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotAcceptableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiOptions,
  UploadApiResponse,
  ResourceType,
} from 'cloudinary';

type UploadType = 'image' | 'file' | 'voice' | 'video';

type CloudinaryDestroyResponse = {
  result: string;
};

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  private readonly allowedMimeTypes: Record<UploadType, string[]> = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    voice: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/m4a',
      'audio/mp4',
      'audio/aac',
      'audio/x-m4a',
    ],
    file: [
      'application/pdf',
      'application/zip',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  };

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    type: UploadType,
  ): Promise<{
    url: string;
    publicId: string;
    resourceType: ResourceType;
  }> {
    if (!file) {
      throw new NotAcceptableException('No file provided');
    }

    this.logger.log(
      `Uploading ${type}: ${file.originalname}, size=${file.size}`,
    );

    this.validateFile(file, type);

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const safeFileName = file.originalname
      .split('.')[0]
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);

    try {
      const uploadOptions: UploadApiOptions = {
        folder: `whisper/${type}s/${year}/${month}`,
        public_id: `${Date.now()}_${safeFileName}`,
        resource_type: this.getResourceType(type),
        overwrite: false,
        unique_filename: true,
        use_filename: false,
      };

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              return reject(error);
            }

            if (!result) {
              return reject(new Error('Upload failed'));
            }

            resolve(result);
          },
        );

        stream.end(file.buffer);
      });

      this.logger.log(`${type} uploaded successfully: ${result.public_id}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type as ResourceType,
      };
    } catch (error) {
      this.logger.error(
        `Upload failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw new InternalServerErrorException(`${type} upload failed`);
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    type: UploadType,
  ): Promise<
    {
      url: string;
      publicId: string;
      resourceType: ResourceType;
    }[]
  > {
    if (!files?.length) {
      return [];
    }

    // Prevent abuse
    if (files.length > 10) {
      throw new NotAcceptableException('Maximum 10 files allowed per upload');
    }

    // Sequential uploads (safer for server memory/load)
    const results: {
      url: string;
      publicId: string;
      resourceType: ResourceType;
    }[] = [];

    for (const file of files) {
      const uploaded = await this.uploadFile(file, type);
      results.push(uploaded);
    }

    return results;
  }

  async deleteCloudinaryFile(
    publicId: string,
    resourceType: ResourceType = 'image',
  ): Promise<void> {
    if (!publicId?.trim()) {
      this.logger.warn('Invalid public ID');
      return;
    }

    try {
      const result = (await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: resourceType,
      })) as CloudinaryDestroyResponse;

      this.logger.log(`Deleted file: ${publicId}, result=${result.result}`);
    } catch (error) {
      this.logger.error(
        `Delete failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private validateFile(file: Express.Multer.File, type: UploadType): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new NotAcceptableException('File size must be less than 10MB');
    }

    const allowedTypes = this.allowedMimeTypes[type];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new NotAcceptableException(`Invalid ${type} format`);
    }
  }

  private getResourceType(type: UploadType): 'image' | 'video' | 'raw' {
    switch (type) {
      case 'image':
        return 'image';

      case 'video':
        return 'video';

      case 'voice':
        return 'video';

      case 'file':
      default:
        return 'raw';
    }
  }
}
