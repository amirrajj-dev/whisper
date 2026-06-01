import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { UploadService } from 'src/upload/upload.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import mongoose from 'mongoose';

describe('UserService', () => {
  let service: UserService;
  let userModel: any;
  let uploadService: jest.Mocked<UploadService>;

  const mockUploadService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockUserModel = Object.assign(
    jest.fn(() => ({ save: jest.fn().mockResolvedValue(undefined) })),
    {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
    },
  );

  const mockQuery = (result: any) => ({
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  });

  const mockThenableQuery = (result: any) => {
    const q = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: (resolve: (v: any) => any) => Promise.resolve(result).then(resolve),
      exec: jest.fn().mockResolvedValue(result),
    };
    return q;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest
      .spyOn(mongoose.Types, 'ObjectId')
      .mockImplementation(
        (id?: any) => ({ toString: () => String(id), _id: String(id) }) as any,
      );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get(getModelToken('User'));
    uploadService = module.get(UploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return paginated users excluding current user', async () => {
      const mockUsers = [
        { _id: 'user2', username: 'user2', email: 'user2@test.com' },
      ];
      mockUserModel.find.mockReturnValue(mockQuery(mockUsers));
      mockUserModel.countDocuments.mockResolvedValue(1);

      const result = await service.getUsers('user1', 1, 20);

      expect(result).toEqual({
        users: mockUsers,
        total: 1,
        page: 1,
        totalPages: 1,
      });
      expect(mockUserModel.find).toHaveBeenCalledWith({
        _id: { $ne: 'user1' },
      });
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const user = { _id: 'user1', email: 'test@test.com' };
      mockUserModel.findOne.mockReturnValue(mockQuery(user));

      const result = await service.findUserByEmail('test@test.com');
      expect(result).toBe(user);
    });

    it('should return null when user not found', async () => {
      mockUserModel.findOne.mockReturnValue(mockQuery(null));
      const result = await service.findUserByEmail('nonexistent@test.com');
      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should find user by id', async () => {
      const user = { _id: 'user1', username: 'testuser' };
      mockUserModel.findById.mockReturnValue(mockQuery(user));

      const result = await service.findUserById('user1');
      expect(result).toBe(user);
    });

    it('should return null when user not found', async () => {
      mockUserModel.findById.mockReturnValue(mockQuery(null));
      const result = await service.findUserById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create and save a new user', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'hashed',
        username: 'testuser',
      };
      const savedUser = {
        _id: 'user1',
        ...userData,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockUserModel.mockReturnValue(savedUser);

      const result = await service.createUser(userData);

      expect(mockUserModel).toHaveBeenCalledWith(userData);
      expect(savedUser.save).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const existingUser = {
      _id: 'user1',
      username: 'oldname',
      email: 'old@test.com',
      bio: '',
      avatarUrl: null,
      publicId: null,
    };

    beforeEach(() => {
      mockUserModel.findById.mockReturnValue(mockQuery(existingUser));
      mockUserModel.findOne.mockResolvedValue(null);
    });

    it('should update user details', async () => {
      const updatedUser = {
        ...existingUser,
        username: 'newname',
        bio: 'New bio',
      };
      mockUserModel.findByIdAndUpdate.mockReturnValue(
        mockThenableQuery(updatedUser),
      );

      const result = await service.updateUser('user1', {
        username: 'newname',
        bio: 'New bio',
      });

      expect(result).toBe(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user1',
        expect.objectContaining({
          username: 'newname',
          bio: 'New bio',
          updatedAt: expect.any(Date),
        }),
        expect.any(Object),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockReturnValue(mockQuery(null));

      await expect(
        service.updateUser('nonexistent', { username: 'newname' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when email is taken', async () => {
      mockUserModel.findOne.mockResolvedValue({ _id: 'user2' });

      await expect(
        service.updateUser('user1', { email: 'taken@test.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when username is taken', async () => {
      mockUserModel.findOne.mockResolvedValue({ _id: 'user2' });

      await expect(
        service.updateUser('user1', { username: 'takenname' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no changes detected', async () => {
      await expect(
        service.updateUser('user1', { username: 'oldname' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle avatar upload', async () => {
      const existingWithAvatar = {
        ...existingUser,
        avatarUrl: 'old-avatar.jpg',
        publicId: 'old-public-id',
      };
      mockUserModel.findById.mockReturnValue(mockQuery(existingWithAvatar));

      mockUploadService.deleteFile.mockResolvedValue(undefined);
      mockUploadService.uploadFile.mockResolvedValue({
        url: 'new-avatar.jpg',
        publicId: 'new-public-id',
        resourceType: 'image',
      });

      const updatedUser = {
        ...existingWithAvatar,
        avatarUrl: 'new-avatar.jpg',
        publicId: 'new-public-id',
      };
      mockUserModel.findByIdAndUpdate.mockReturnValue(
        mockThenableQuery(updatedUser),
      );

      const file = { originalname: 'avatar.jpg' } as Express.Multer.File;
      const result = await service.updateUser(
        'user1',
        { username: 'oldname' },
        file,
      );

      expect(mockUploadService.deleteFile).toHaveBeenCalledWith(
        'old-public-id',
        'image',
      );
      expect(mockUploadService.uploadFile).toHaveBeenCalledWith(file, 'image');
      expect(result.avatarUrl).toBe('new-avatar.jpg');
    });
  });

  describe('isUsernameTaken', () => {
    it('should return true when username exists', async () => {
      mockUserModel.findOne.mockResolvedValue({ _id: 'user1' });

      const result = await service.isUsernameTaken('testuser');
      expect(result).toBe(true);
    });

    it('should return false when username is available', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.isUsernameTaken('newname');
      expect(result).toBe(false);
    });
  });

  describe('getBlockedUsers', () => {
    it('should return blocked users array', async () => {
      mockUserModel.findById.mockReturnValue(
        mockQuery({ blockedUsers: ['blocked1', 'blocked2'] }),
      );

      const result = await service.getBlockedUsers('user1');
      expect(result).toEqual(['blocked1', 'blocked2']);
    });

    it('should return empty array when no blocked users', async () => {
      mockUserModel.findById.mockReturnValue(mockQuery({ blockedUsers: [] }));

      const result = await service.getBlockedUsers('user1');
      expect(result).toEqual([]);
    });
  });

  describe('blockUser', () => {
    it('should block a user', async () => {
      mockUserModel.findById.mockImplementation((id: any, projection?: any) => {
        const uid = id?._id || String(id);
        if (projection) {
          const users: Record<string, any> = {
            user2: { _id: 'user2', username: 'user2' },
            user1: { _id: 'user1', blockedUsers: [] },
          };
          return mockQuery(users[uid] ?? null);
        }
        const users: Record<string, any> = {
          user1: { _id: 'user1', blockedUsers: [] },
        };
        return Promise.resolve(users[uid] ?? null);
      });
      mockUserModel.findByIdAndUpdate.mockResolvedValue(undefined);

      const result = await service.blockUser('user1', 'user2');

      expect(result).toEqual({ message: 'User blocked successfully' });
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user1',
        expect.objectContaining({
          $addToSet: { blockedUsers: expect.any(Object) },
        }),
      );
    });

    it('should throw BadRequestException when blocking self', async () => {
      await expect(service.blockUser('user1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when target user not found', async () => {
      mockUserModel.findById.mockReturnValue(mockQuery(null));

      await expect(service.blockUser('user1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when already blocked', async () => {
      mockUserModel.findById.mockImplementation((id: any, projection?: any) => {
        const uid = id?._id || String(id);
        if (projection) {
          const users: Record<string, any> = {
            user2: { _id: 'user2', username: 'user2' },
            user1: { _id: 'user1', blockedUsers: ['user2'] },
          };
          return mockQuery(users[uid] ?? null);
        }
        const users: Record<string, any> = {
          user1: { _id: 'user1', blockedUsers: ['user2'] },
        };
        return Promise.resolve(users[uid] ?? null);
      });

      await expect(service.blockUser('user1', 'user2')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: 'user1',
        blockedUsers: ['user2'],
      });
      mockUserModel.findByIdAndUpdate.mockResolvedValue(undefined);

      const result = await service.unblockUser('user1', 'user2');

      expect(result).toEqual({ message: 'User unblocked successfully' });
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user1',
        expect.objectContaining({
          $pull: { blockedUsers: expect.any(Object) },
        }),
      );
    });

    it('should throw BadRequestException when user not blocked', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: 'user1',
        blockedUsers: [],
      });

      await expect(service.unblockUser('user1', 'user2')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
