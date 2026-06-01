import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { getModelToken } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserService } from 'src/user/user.service';
import { UploadService } from 'src/upload/upload.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import mongoose from 'mongoose';

describe('ChatService', () => {
  let service: ChatService;
  let conversationModel: any;
  let messageModel: any;
  let userService: jest.Mocked<UserService>;
  let uploadService: jest.Mocked<UploadService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const createConvModelInstance = (overrides = {}) => ({
    _id: 'conv1',
    type: 'private',
    participants: [],
    admins: [],
    owner: null,
    publicId: null,
    name: null,
    avatarUrl: null,
    createdBy: null,
    lastMessage: null,
    lastMessageAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  const mockConversationModel = Object.assign(
    jest.fn(() => createConvModelInstance()),
    {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
    },
  );

  const createMsgModelInstance = (overrides = {}) => ({
    _id: 'msg1',
    conversationId: '',
    senderId: '',
    type: 'text',
    content: '',
    publicId: undefined,
    replyTo: null,
    edited: false,
    deleted: false,
    deliveredTo: [],
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  const mockMessageModel = Object.assign(
    jest.fn(() => createMsgModelInstance()),
    {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      deleteMany: jest.fn(),
      countDocuments: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
  );

  const mockUserService = {
    findUserById: jest.fn(),
    getBlockedUsers: jest.fn(),
  };

  const mockUploadService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
  };

  const mockObjectId = (id: string) => ({ toString: () => id, _id: id }) as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest
      .spyOn(mongoose.Types, 'ObjectId')
      .mockImplementation(
        (id?: any) => ({ toString: () => String(id), _id: String(id) }) as any,
      );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getModelToken('Conversation'),
          useValue: mockConversationModel,
        },
        { provide: getModelToken('Message'), useValue: mockMessageModel },
        { provide: UserService, useValue: mockUserService },
        { provide: UploadService, useValue: mockUploadService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    conversationModel = module.get(getModelToken('Conversation'));
    messageModel = module.get(getModelToken('Message'));
    userService = module.get(UserService);
    uploadService = module.get(UploadService);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserConversations', () => {
    it('should return paginated conversations for a user', async () => {
      const mockConversations = [{ _id: 'conv1', name: 'Test' }];
      const mockQuery = {
        lean: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockConversations),
      };
      mockConversationModel.find.mockReturnValue(mockQuery);
      mockConversationModel.countDocuments.mockResolvedValue(1);

      const result = await service.getUserConversations('user1', 1, 20);

      expect(result).toEqual({
        conversations: mockConversations,
        total: 1,
        page: 1,
        totalPages: 1,
      });
      expect(mockConversationModel.find).toHaveBeenCalledWith({
        participants: { $in: ['user1'] },
      });
    });

    it('should cap limit at 50', async () => {
      const mockQuery = {
        lean: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockConversationModel.find.mockReturnValue(mockQuery);
      mockConversationModel.countDocuments.mockResolvedValue(0);

      await service.getUserConversations('user1', 1, 100);

      expect(mockQuery.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('getMessages', () => {
    const mockConversation = {
      _id: 'conv1',
      participants: [mockObjectId('user1'), mockObjectId('user2')],
    } as any;

    it('should return paginated messages', async () => {
      mockConversationModel.findById.mockResolvedValue(mockConversation);

      const mockMessages = [{ _id: 'msg1', content: 'Hello' }];
      const mockMsgQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMessages),
      };
      mockMessageModel.find.mockReturnValue(mockMsgQuery);
      mockMessageModel.countDocuments.mockResolvedValue(1);
      mockMessageModel.updateMany.mockResolvedValue({ modifiedCount: 1 });

      const result = await service.getMessages('user1', 'conv1', 1, 50);

      expect(result.messages).toEqual(mockMessages);
      expect(mockMessageModel.updateMany).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'chat.message.read',
        expect.objectContaining({ conversationId: 'conv1', userId: 'user1' }),
      );
    });

    it('should throw NotFoundException when conversation not found', async () => {
      mockConversationModel.findById.mockResolvedValue(null);

      await expect(
        service.getMessages('user1', 'conv1', 1, 50),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user is not participant', async () => {
      const conv = {
        _id: 'conv1',
        participants: [mockObjectId('user2')],
      } as any;
      mockConversationModel.findById.mockResolvedValue(conv);

      await expect(
        service.getMessages('user1', 'conv1', 1, 50),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should cap limit at 100', async () => {
      mockConversationModel.findById.mockResolvedValue(mockConversation);
      const mockMsgQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockMessageModel.find.mockReturnValue(mockMsgQuery);
      mockMessageModel.countDocuments.mockResolvedValue(0);
      mockMessageModel.updateMany.mockResolvedValue({});

      await service.getMessages('user1', 'conv1', 1, 200);

      expect(mockMsgQuery.limit).toHaveBeenCalledWith(100);
    });
  });

  describe('getConversationById', () => {
    it('should return conversation when user is participant', async () => {
      const mockConv = {
        _id: 'conv1',
        participants: [
          { _id: mockObjectId('user1') },
          { _id: mockObjectId('user2') },
        ],
      } as any;
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockConv),
      };
      mockConversationModel.findById.mockReturnValue(mockQuery);

      const result = await service.getConversationById('user1', 'conv1');
      expect(result).toBe(mockConv);
    });

    it('should throw NotFoundException when conversation not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      mockConversationModel.findById.mockReturnValue(mockQuery);

      await expect(
        service.getConversationById('user1', 'conv1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user is not participant', async () => {
      const mockConv = {
        _id: 'conv1',
        participants: [{ _id: mockObjectId('user3') }],
      } as any;
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockConv),
      };
      mockConversationModel.findById.mockReturnValue(mockQuery);

      await expect(
        service.getConversationById('user1', 'conv1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createConversation', () => {
    const createDto = {
      type: 'private' as const,
      participants: ['user2'],
      name: undefined,
    };

    beforeEach(() => {
      mockConversationModel.mockClear();
      mockConversationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue(createConvModelInstance({ _id: 'conv1' })),
      });
    });

    it('should create a private conversation', async () => {
      mockUserService.findUserById.mockResolvedValue({ _id: 'user2' } as any);
      mockConversationModel.findOne.mockResolvedValue(null);

      const result = await service.createConversation('user1', createDto);

      expect(mockConversationModel).toHaveBeenCalled();
      const instance = mockConversationModel.mock.results[0].value;
      expect(instance.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'chat.conversation.created',
        expect.objectContaining({
          conversationId: 'conv1',
          participants: expect.arrayContaining(['user1', 'user2']),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should return existing private conversation if found', async () => {
      mockUserService.findUserById.mockResolvedValue({ _id: 'user2' } as any);
      const existing = { _id: 'existingConv' };
      mockConversationModel.findOne.mockResolvedValue(existing);

      const result = await service.createConversation('user1', {
        type: 'private',
        participants: ['user2'],
        name: undefined,
      });

      expect(result).toBe(existing);
      expect(mockConversationModel).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for group without name', async () => {
      await expect(
        service.createConversation('user1', {
          type: 'group',
          participants: ['user2', 'user3'],
          name: undefined,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when participant not found', async () => {
      mockUserService.findUserById.mockResolvedValue(null);

      await expect(
        service.createConversation('user1', createDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendMessage', () => {
    const sendDto = {
      conversationId: 'conv1',
      type: 'text' as const,
      content: 'Hello!',
      replyTo: undefined,
    };

    const mockConversation = {
      _id: 'conv1',
      participants: [mockObjectId('user1'), mockObjectId('user2')],
    } as any;

    beforeEach(() => {
      mockMessageModel.mockClear();
      mockConversationModel.findById.mockResolvedValue(mockConversation);
      mockUserService.getBlockedUsers.mockResolvedValue([]);
      mockMessageModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: 'msg1',
          senderId: { username: 'testuser' },
        }),
      });
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(undefined);
    });

    it('should send a text message', async () => {
      const result = await service.sendMessage('user1', sendDto);

      expect(mockMessageModel).toHaveBeenCalled();
      const instance = mockMessageModel.mock.results[0].value;
      expect(instance.save).toHaveBeenCalled();
      expect(mockConversationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'conv1',
        expect.objectContaining({ lastMessage: 'Hello!' }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'chat.message.sent',
        expect.objectContaining({
          conversationId: 'conv1',
          senderId: 'user1',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when conversation not found', async () => {
      mockConversationModel.findById.mockResolvedValue(null);

      await expect(service.sendMessage('user1', sendDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when sender is blocked', async () => {
      mockUserService.getBlockedUsers.mockResolvedValue(['user1']);

      await expect(service.sendMessage('user1', sendDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException for empty text message', async () => {
      await expect(
        service.sendMessage('user1', { ...sendDto, content: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when media message has no file', async () => {
      await expect(
        service.sendMessage('user1', {
          ...sendDto,
          type: 'image',
          content: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('editMessage', () => {
    it('should edit a text message', async () => {
      const msg = {
        _id: 'msg1',
        conversationId: 'conv1',
        senderId: mockObjectId('user1'),
        type: 'text',
        content: 'Old content',
        edited: false,
        deleted: false,
        save: jest.fn().mockResolvedValue(undefined),
      } as any;

      const updatedMsg = { ...msg, content: 'Updated', edited: true };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedMsg),
      };

      mockMessageModel.findById
        .mockResolvedValueOnce(msg)
        .mockReturnValueOnce(mockQuery);

      const result = await service.editMessage('user1', 'msg1', {
        content: 'Updated',
      });

      expect(msg.save).toHaveBeenCalled();
      expect(msg.content).toBe('Updated');
      expect(msg.edited).toBe(true);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'chat.message.edited',
        expect.objectContaining({ messageId: 'msg1' }),
      );
    });

    it('should throw NotFoundException when message not found', async () => {
      mockMessageModel.findById.mockResolvedValue(null);

      await expect(
        service.editMessage('user1', 'msg1', { content: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when not the sender', async () => {
      mockMessageModel.findById.mockResolvedValue({
        senderId: mockObjectId('user2'),
        type: 'text',
      } as any);

      await expect(
        service.editMessage('user1', 'msg1', { content: 'test' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when editing deleted message', async () => {
      mockMessageModel.findById.mockResolvedValue({
        senderId: mockObjectId('user1'),
        type: 'text',
        deleted: true,
      } as any);

      await expect(
        service.editMessage('user1', 'msg1', { content: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when editing non-text message', async () => {
      mockMessageModel.findById.mockResolvedValue({
        senderId: mockObjectId('user1'),
        type: 'image',
        deleted: false,
      } as any);

      await expect(
        service.editMessage('user1', 'msg1', { content: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteMessage', () => {
    it('should soft delete a message', async () => {
      const msg = {
        _id: 'msg1',
        conversationId: 'conv1',
        senderId: mockObjectId('user1'),
        type: 'text',
        content: 'Hello',
        publicId: undefined,
        deleted: false,
        save: jest.fn().mockResolvedValue(undefined),
      } as any;
      mockMessageModel.findById.mockResolvedValue(msg);
      mockConversationModel.findById.mockResolvedValue({
        type: 'private',
        participants: [mockObjectId('user1')],
      } as any);

      const result = await service.deleteMessage('user1', 'msg1');

      expect(msg.deleted).toBe(true);
      expect(msg.content).toBe('[Message deleted]');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'chat.message.deleted',
        expect.objectContaining({ messageId: 'msg1' }),
      );
      expect(result).toEqual({ message: 'Message deleted successfully' });
    });

    it('should throw NotFoundException when message not found', async () => {
      mockMessageModel.findById.mockResolvedValue(null);

      await expect(service.deleteMessage('user1', 'msg1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addParticipants', () => {
    it('should add new participants to a group', async () => {
      const conv = {
        _id: 'conv1',
        type: 'group',
        participants: [mockObjectId('user1')],
        admins: [mockObjectId('user1')],
        owner: mockObjectId('owner1'),
      } as any;
      mockConversationModel.findById.mockResolvedValue(conv);
      mockUserService.findUserById.mockResolvedValue({ _id: 'user3' } as any);

      const updatedConv = { ...conv, participants: ['user1', 'user3'] };
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(undefined);
      mockConversationModel.findById
        .mockResolvedValueOnce(conv)
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(updatedConv),
        });

      const result = await service.addParticipants('user1', 'conv1', {
        userIds: ['user3'],
      });

      expect(mockConversationModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'chat.participant.added',
        expect.objectContaining({
          conversationId: 'conv1',
          newParticipants: ['user3'],
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException for private chats', async () => {
      mockConversationModel.findById.mockResolvedValue({
        type: 'private',
      } as any);

      await expect(
        service.addParticipants('user1', 'conv1', { userIds: ['user2'] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('promoteToAdmin', () => {
    it('should promote a participant to admin', async () => {
      const conv = {
        _id: 'conv1',
        type: 'group',
        participants: [mockObjectId('user1'), mockObjectId('user2')],
        admins: [mockObjectId('user1')],
        owner: mockObjectId('user1'),
      } as any;

      const updatedConv = {
        ...conv,
        admins: [mockObjectId('user1'), mockObjectId('user2')],
      };
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(undefined);
      mockConversationModel.findById
        .mockResolvedValueOnce(conv)
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(updatedConv),
        });

      const result = await service.promoteToAdmin('user1', 'conv1', 'user2');

      expect(mockConversationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'conv1',
        expect.objectContaining({
          $addToSet: { admins: expect.any(Object) },
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'chat.participant.role.changed',
        expect.objectContaining({
          conversationId: 'conv1',
          targetUserId: 'user2',
          isPromotion: true,
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('demoteFromAdmin', () => {
    it('should demote an admin', async () => {
      const conv = {
        _id: 'conv1',
        type: 'group',
        participants: [mockObjectId('user1'), mockObjectId('user2')],
        admins: [mockObjectId('user2')],
        owner: mockObjectId('user1'),
      } as any;

      const updatedConv = { ...conv, admins: [] };
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(undefined);
      mockConversationModel.findById
        .mockResolvedValueOnce(conv)
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(updatedConv),
        });

      const result = await service.demoteFromAdmin('user1', 'conv1', 'user2');

      expect(mockConversationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'conv1',
        expect.objectContaining({
          $pull: { admins: expect.any(Object) },
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'chat.participant.role.changed',
        expect.objectContaining({
          conversationId: 'conv1',
          targetUserId: 'user2',
          isPromotion: false,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException when non-owner tries to demote', async () => {
      const conv = {
        _id: 'conv1',
        type: 'group',
        participants: [mockObjectId('user1'), mockObjectId('user2')],
        admins: [mockObjectId('user2')],
        owner: mockObjectId('owner1'),
      } as any;
      mockConversationModel.findById.mockResolvedValue(conv);

      await expect(
        service.demoteFromAdmin('user1', 'conv1', 'user2'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('transferOwnership', () => {
    it('should transfer ownership to another participant', async () => {
      const conv = {
        _id: 'conv1',
        type: 'group',
        participants: [mockObjectId('user1'), mockObjectId('user2')],
        admins: [],
        owner: mockObjectId('user1'),
      } as any;
      mockConversationModel.findById.mockResolvedValue(conv);

      const updatedConv = {
        ...conv,
        owner: mockObjectId('user2'),
        admins: [mockObjectId('user1')],
      };
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(undefined);
      mockConversationModel.findById
        .mockResolvedValueOnce(conv)
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(updatedConv),
        });

      const result = await service.transferOwnership('user1', 'conv1', 'user2');

      expect(mockConversationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'conv1',
        expect.objectContaining({
          owner: expect.any(Object),
          $addToSet: { admins: expect.any(Object) },
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'chat.ownership.transferred',
        expect.objectContaining({
          conversationId: 'conv1',
          newOwnerId: 'user2',
          previousOwnerId: 'user1',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when transferring to self', async () => {
      const conv = {
        _id: 'conv1',
        type: 'group',
        participants: [mockObjectId('user1'), mockObjectId('user2')],
        owner: mockObjectId('user1'),
      } as any;
      mockConversationModel.findById.mockResolvedValue(conv);

      await expect(
        service.transferOwnership('user1', 'conv1', 'user1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeParticipant', () => {
    it('should remove a participant from a group', async () => {
      const conv = {
        _id: 'conv1',
        type: 'group',
        participants: [
          mockObjectId('user1'),
          mockObjectId('user2'),
          mockObjectId('user3'),
        ],
        admins: [mockObjectId('user1')],
        owner: mockObjectId('owner1'),
      } as any;
      mockConversationModel.findById.mockResolvedValue(conv);
      mockUserService.findUserById.mockResolvedValue({ _id: 'user3' } as any);

      const updatedConv = {
        ...conv,
        participants: [mockObjectId('user1'), mockObjectId('user2')],
      };
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(undefined);
      mockConversationModel.findById
        .mockResolvedValueOnce(conv)
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(updatedConv),
        });

      const result = await service.removeParticipant('user1', 'conv1', 'user3');

      expect(mockConversationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'conv1',
        expect.objectContaining({
          $pull: {
            participants: expect.any(Object),
            admins: expect.any(Object),
          },
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'chat.participant.removed',
        expect.objectContaining({
          conversationId: 'conv1',
          removedUserId: 'user3',
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('updateConversation', () => {
    it('should update group conversation details', async () => {
      const conv = {
        _id: 'conv1',
        type: 'group',
        owner: mockObjectId('user1'),
        publicId: undefined,
      } as any;
      mockConversationModel.findById.mockResolvedValue(conv);

      const updatedConv = { ...conv, name: 'New Name' };
      mockConversationModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedConv),
      });

      const result = await service.updateConversation('user1', 'conv1', {
        name: 'New Name',
      });

      expect(mockConversationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'conv1',
        expect.objectContaining({ name: 'New Name' }),
        expect.any(Object),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'chat.conversation.updated',
        expect.objectContaining({
          conversationId: 'conv1',
          updatedBy: 'user1',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException for private chats', async () => {
      mockConversationModel.findById.mockResolvedValue({
        type: 'private',
      } as any);

      await expect(
        service.updateConversation('user1', 'conv1', { name: 'New' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteConversation', () => {
    it('should delete a group conversation and its messages', async () => {
      const conv = {
        _id: 'conv1',
        type: 'group',
        owner: mockObjectId('user1'),
        publicId: undefined,
      } as any;
      mockConversationModel.findById.mockResolvedValue(conv);

      mockMessageModel.find.mockResolvedValue([]);
      mockMessageModel.deleteMany.mockReturnValue({
        session: jest.fn().mockResolvedValue({ deletedCount: 5 }),
      });
      mockConversationModel.findByIdAndDelete.mockReturnValue({
        session: jest.fn().mockResolvedValue(undefined),
      });

      jest.spyOn(mongoose, 'startSession').mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      } as any);

      const result = await service.deleteConversation('user1', 'conv1');

      expect(mockMessageModel.deleteMany).toHaveBeenCalledWith({
        conversationId: 'conv1',
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'chat.conversation.deleted',
        expect.objectContaining({
          conversationId: 'conv1',
          deletedBy: 'user1',
        }),
      );
      expect(result).toEqual({ message: 'Group deleted successfully' });
    });

    it('should throw BadRequestException for private chats', async () => {
      mockConversationModel.findById.mockResolvedValue({
        type: 'private',
      } as any);

      await expect(
        service.deleteConversation('user1', 'conv1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
