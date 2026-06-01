import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { GatewayService } from 'src/gateway/gateway.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';

describe('NotificationService', () => {
  let service: NotificationService;
  let gatewayService: jest.Mocked<GatewayService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const createMockModel = () => {
    const model: any = jest.fn();
    model.find = jest.fn();
    model.findOne = jest.fn();
    model.findOneAndUpdate = jest.fn();
    model.findOneAndDelete = jest.fn();
    model.findByIdAndUpdate = jest.fn();
    model.countDocuments = jest.fn();
    model.updateMany = jest.fn();
    return model;
  };
  let mockNotificationModel: ReturnType<typeof createMockModel>;

  const mockGatewayService = {
    emitToUser: jest.fn(),
    isUserOnline: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockNotificationModel = createMockModel();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getModelToken('Notification'),
          useValue: mockNotificationModel,
        },
        { provide: GatewayService, useValue: mockGatewayService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    gatewayService = module.get(GatewayService);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification and emit event', async () => {
      const notificationInstance = {
        _id: 'notif1',
        userId: 'user1',
        type: 'message',
        message: 'Test notification',
        relatedConversation: 'conv1',
        isRead: false,
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockNotificationModel.mockReturnValue(notificationInstance);

      const result = await service.create({
        userId: 'user1',
        type: 'message',
        relatedConversation: 'conv1',
        message: 'Test notification',
      });

      expect(mockNotificationModel).toHaveBeenCalledWith({
        userId: 'user1',
        type: 'message',
        relatedConversation: 'conv1',
        message: 'Test notification',
        isRead: false,
      });
      expect(notificationInstance.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'notification.created',
        expect.objectContaining({
          userId: 'user1',
          notification: expect.objectContaining({
            type: 'message',
            message: 'Test notification',
          }),
        }),
      );
      expect(result).toBe(notificationInstance);
    });
  });

  describe('findByUser', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        { _id: 'n1', message: 'Test 1' },
        { _id: 'n2', message: 'Test 2' },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockNotifications),
      };

      mockNotificationModel.find.mockReturnValue(mockQuery);
      mockNotificationModel.countDocuments.mockResolvedValue(2);

      const result = await service.findByUser('user1', 1, 20);

      expect(result).toEqual({
        notifications: mockNotifications,
        total: 2,
        page: 1,
        totalPages: 1,
      });
      expect(mockNotificationModel.find).toHaveBeenCalledWith({
        userId: 'user1',
      });
    });

    it('should cap limit at 50', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockNotificationModel.find.mockReturnValue(mockQuery);
      mockNotificationModel.countDocuments.mockResolvedValue(0);

      await service.findByUser('user1', 1, 100);

      expect(mockQuery.limit).toHaveBeenCalledWith(50);
    });

    it('should handle calculation of total pages', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockNotificationModel.find.mockReturnValue(mockQuery);
      mockNotificationModel.countDocuments.mockResolvedValue(25);

      const result = await service.findByUser('user1', 2, 10);

      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(2);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read and return it', async () => {
      const mockUpdated = {
        _id: 'n1',
        isRead: true,
        updatedAt: new Date(),
      };
      mockNotificationModel.findOneAndUpdate.mockResolvedValue(mockUpdated);

      const result = await service.markAsRead('n1', 'user1');

      expect(result).toEqual(mockUpdated);
      expect(mockNotificationModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'n1', userId: 'user1' },
        { isRead: true, updatedAt: expect.any(Date) },
        { new: true },
      );
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockNotificationModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.markAsRead('n1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockNotificationModel.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const result = await service.markAllAsRead('user1');

      expect(result).toEqual({ message: 'All notifications marked as read' });
      expect(mockNotificationModel.updateMany).toHaveBeenCalledWith(
        { userId: 'user1', isRead: false },
        { isRead: true, updatedAt: expect.any(Date) },
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockNotificationModel.countDocuments.mockResolvedValue(5);

      const result = await service.getUnreadCount('user1');

      expect(result).toEqual({ count: 5 });
      expect(mockNotificationModel.countDocuments).toHaveBeenCalledWith({
        userId: 'user1',
        isRead: false,
      });
    });
  });

  describe('delete', () => {
    it('should delete notification and return success', async () => {
      mockNotificationModel.findOneAndDelete.mockResolvedValue({
        _id: 'n1',
      });

      const result = await service.delete('n1', 'user1');

      expect(result).toEqual({
        message: 'Notification deleted successfully',
      });
      expect(mockNotificationModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'n1',
        userId: 'user1',
      });
    });

    it('should throw NotFoundException when notification to delete not found', async () => {
      mockNotificationModel.findOneAndDelete.mockResolvedValue(null);

      await expect(service.delete('n1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
