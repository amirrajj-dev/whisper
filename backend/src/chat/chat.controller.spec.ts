import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.gurad';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: jest.Mocked<ChatService>;

  const mockChatService = {
    getUserConversations: jest.fn(),
    getConversationById: jest.fn(),
    getMessages: jest.fn(),
    createConversation: jest.fn(),
    addParticipants: jest.fn(),
    promoteToAdmin: jest.fn(),
    demoteFromAdmin: jest.fn(),
    transferOwnership: jest.fn(),
    sendMessage: jest.fn(),
    deleteMessage: jest.fn(),
    removeParticipant: jest.fn(),
    updateConversation: jest.fn(),
    editMessage: jest.fn(),
    deleteConversation: jest.fn(),
  };

  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: mockChatService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get(ChatService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserConversations', () => {
    it('should call service with pagination params', async () => {
      const expected = { conversations: [], total: 0, page: 1, totalPages: 0 };
      mockChatService.getUserConversations.mockResolvedValue(expected);

      const result = await controller.getUserConversations(mockUser as any, {
        page: 1,
        limit: 20,
      });

      expect(result).toBe(expected);
      expect(mockChatService.getUserConversations).toHaveBeenCalledWith(
        'user123',
        1,
        20,
      );
    });
  });

  describe('getConversationById', () => {
    it('should call service with conversation id', async () => {
      const expected = { _id: 'conv1' };
      mockChatService.getConversationById.mockResolvedValue(expected);

      const result = await controller.getConversationById(
        mockUser as any,
        'conv1',
      );

      expect(result).toBe(expected);
      expect(mockChatService.getConversationById).toHaveBeenCalledWith(
        'user123',
        'conv1',
      );
    });
  });

  describe('getMessages', () => {
    it('should call service with conversation id and pagination', async () => {
      const expected = { messages: [], total: 0, page: 1, totalPages: 0 };
      mockChatService.getMessages.mockResolvedValue(expected);

      const result = await controller.getMessages(mockUser as any, 'conv1', {
        page: 1,
        limit: 50,
      });

      expect(result).toBe(expected);
      expect(mockChatService.getMessages).toHaveBeenCalledWith(
        'user123',
        'conv1',
        1,
        50,
      );
    });
  });

  describe('createConversation', () => {
    it('should call service with create dto', async () => {
      const dto = {
        type: 'private' as const,
        participants: ['user2'],
        name: undefined,
      };
      const expected = { _id: 'conv1' };
      mockChatService.createConversation.mockResolvedValue(expected);

      const result = await controller.createConversation(
        mockUser as any,
        dto,
        undefined,
      );

      expect(result).toBe(expected);
      expect(mockChatService.createConversation).toHaveBeenCalledWith(
        'user123',
        dto,
        undefined,
      );
    });
  });

  describe('addParticipants', () => {
    it('should call service addParticipants', () => {
      const dto = { userIds: ['user3'] };
      const expected = { _id: 'conv1' };
      mockChatService.addParticipants.mockReturnValue(expected);

      const result = controller.addParticipants(mockUser as any, 'conv1', dto);

      expect(result).toBe(expected);
      expect(mockChatService.addParticipants).toHaveBeenCalledWith(
        'user123',
        'conv1',
        dto,
      );
    });
  });

  describe('promoteToAdmin', () => {
    it('should call service promoteToAdmin', () => {
      const expected = { _id: 'conv1' };
      mockChatService.promoteToAdmin.mockReturnValue(expected);

      const result = controller.promoteToAdmin(
        mockUser as any,
        'conv1',
        'user2',
      );

      expect(result).toBe(expected);
      expect(mockChatService.promoteToAdmin).toHaveBeenCalledWith(
        'user123',
        'conv1',
        'user2',
      );
    });
  });

  describe('transferOwnership', () => {
    it('should call service transferOwnership', () => {
      const dto = { newOwnerId: 'user2' };
      const expected = { _id: 'conv1' };
      mockChatService.transferOwnership.mockReturnValue(expected);

      const result = controller.transferOwnership(
        mockUser as any,
        'conv1',
        dto,
      );

      expect(result).toBe(expected);
      expect(mockChatService.transferOwnership).toHaveBeenCalledWith(
        'user123',
        'conv1',
        'user2',
      );
    });
  });

  describe('sendMessage', () => {
    it('should call service sendMessage', async () => {
      const dto = {
        conversationId: 'conv1',
        type: 'text' as const,
        content: 'Hello',
      };
      const expected = { _id: 'msg1' };
      mockChatService.sendMessage.mockResolvedValue(expected);

      const result = await controller.sendMessage(
        mockUser as any,
        dto,
        undefined,
      );

      expect(result).toBe(expected);
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'user123',
        dto,
        undefined,
      );
    });
  });

  describe('demoteFromAdmin', () => {
    it('should call service demoteFromAdmin', () => {
      const expected = { _id: 'conv1' };
      mockChatService.demoteFromAdmin.mockReturnValue(expected);

      const result = controller.demoteFromAdmin(
        mockUser as any,
        'conv1',
        'user2',
      );

      expect(result).toBe(expected);
      expect(mockChatService.demoteFromAdmin).toHaveBeenCalledWith(
        'user123',
        'conv1',
        'user2',
      );
    });
  });

  describe('deleteMessage', () => {
    it('should call service deleteMessage', async () => {
      const expected = { message: 'Message deleted successfully' };
      mockChatService.deleteMessage.mockResolvedValue(expected);

      const result = await controller.deleteMessage(mockUser as any, 'msg1');

      expect(result).toBe(expected);
      expect(mockChatService.deleteMessage).toHaveBeenCalledWith(
        'user123',
        'msg1',
      );
    });
  });

  describe('removeParticipant', () => {
    it('should call service removeParticipant', () => {
      const expected = { _id: 'conv1' };
      mockChatService.removeParticipant.mockReturnValue(expected);

      const result = controller.removeParticipant(
        mockUser as any,
        'conv1',
        'user3',
      );

      expect(result).toBe(expected);
      expect(mockChatService.removeParticipant).toHaveBeenCalledWith(
        'user123',
        'conv1',
        'user3',
      );
    });
  });

  describe('deleteConversation', () => {
    it('should call service deleteConversation', () => {
      const expected = { message: 'Group deleted successfully' };
      mockChatService.deleteConversation.mockReturnValue(expected);

      const result = controller.deleteConversation(mockUser as any, 'conv1');

      expect(result).toBe(expected);
      expect(mockChatService.deleteConversation).toHaveBeenCalledWith(
        'user123',
        'conv1',
      );
    });
  });

  describe('updateConversation', () => {
    it('should call service updateConversation', () => {
      const dto = { name: 'New Name' };
      const expected = { _id: 'conv1' };
      mockChatService.updateConversation.mockReturnValue(expected);

      const result = controller.updateConversation(
        mockUser as any,
        'conv1',
        dto,
        undefined,
      );

      expect(result).toBe(expected);
      expect(mockChatService.updateConversation).toHaveBeenCalledWith(
        'user123',
        'conv1',
        dto,
        undefined,
      );
    });
  });

  describe('editMessage', () => {
    it('should call service editMessage', () => {
      const dto = { content: 'Updated' };
      const expected = { _id: 'msg1' };
      mockChatService.editMessage.mockReturnValue(expected);

      const result = controller.editMessage(mockUser as any, 'msg1', dto);

      expect(result).toBe(expected);
      expect(mockChatService.editMessage).toHaveBeenCalledWith(
        'user123',
        'msg1',
        dto,
      );
    });
  });
});
