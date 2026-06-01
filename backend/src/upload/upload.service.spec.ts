import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

describe('UploadService', () => {
  let service: UploadService;
  let cloudinaryService: jest.Mocked<CloudinaryService>;

  const mockCloudinaryService = {
    uploadFile: jest.fn(),
    uploadMultipleFiles: jest.fn(),
    deleteCloudinaryFile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    cloudinaryService = module.get(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should delegate to cloudinaryService.uploadFile', async () => {
      const file = { originalname: 'test.jpg' } as Express.Multer.File;
      const uploadResult = {
        url: 'https://example.com/img.jpg',
        publicId: 'abc123',
        resourceType: 'image' as const,
      };
      mockCloudinaryService.uploadFile.mockResolvedValue(uploadResult);

      const result = await service.uploadFile(file, 'image');

      expect(result).toBe(uploadResult);
      expect(mockCloudinaryService.uploadFile).toHaveBeenCalledWith(
        file,
        'image',
      );
    });

    it('should work with different file types', async () => {
      const file = { originalname: 'test.mp4' } as Express.Multer.File;
      mockCloudinaryService.uploadFile.mockResolvedValue({
        url: 'https://example.com/vid.mp4',
        publicId: 'xyz789',
        resourceType: 'video',
      });

      await service.uploadFile(file, 'video');
      expect(mockCloudinaryService.uploadFile).toHaveBeenCalledWith(
        file,
        'video',
      );
    });

    it('should work with voice type', async () => {
      const file = { originalname: 'test.mp3' } as Express.Multer.File;
      mockCloudinaryService.uploadFile.mockResolvedValue({
        url: 'https://example.com/audio.mp3',
        publicId: 'aud123',
        resourceType: 'video',
      });

      await service.uploadFile(file, 'voice');
      expect(mockCloudinaryService.uploadFile).toHaveBeenCalledWith(
        file,
        'voice',
      );
    });
  });

  describe('uploadMultipleFiles', () => {
    it('should delegate to cloudinaryService.uploadMultipleFiles', async () => {
      const files = [
        { originalname: 'a.jpg' },
        { originalname: 'b.jpg' },
      ] as Express.Multer.File[];
      const uploadResults = [
        {
          url: 'https://example.com/a.jpg',
          publicId: 'a1',
          resourceType: 'image' as const,
        },
        {
          url: 'https://example.com/b.jpg',
          publicId: 'b2',
          resourceType: 'image' as const,
        },
      ];
      mockCloudinaryService.uploadMultipleFiles.mockResolvedValue(
        uploadResults,
      );

      const result = await service.uploadMultipleFiles(files, 'image');

      expect(result).toBe(uploadResults);
      expect(mockCloudinaryService.uploadMultipleFiles).toHaveBeenCalledWith(
        files,
        'image',
      );
    });

    it('should handle empty files array', async () => {
      mockCloudinaryService.uploadMultipleFiles.mockResolvedValue([]);

      const result = await service.uploadMultipleFiles([], 'image');

      expect(result).toEqual([]);
    });
  });

  describe('deleteFile', () => {
    it('should delegate to cloudinaryService.deleteCloudinaryFile', async () => {
      mockCloudinaryService.deleteCloudinaryFile.mockResolvedValue(undefined);

      await service.deleteFile('public123', 'image');

      expect(mockCloudinaryService.deleteCloudinaryFile).toHaveBeenCalledWith(
        'public123',
        'image',
      );
    });

    it('should use default resource type image', async () => {
      mockCloudinaryService.deleteCloudinaryFile.mockResolvedValue(undefined);

      await service.deleteFile('public123');

      expect(mockCloudinaryService.deleteCloudinaryFile).toHaveBeenCalledWith(
        'public123',
        'image',
      );
    });
  });
});
