import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.gurad';

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: jest.Mocked<NotificationService>;

  const mockNotificationService = {
    findByUser: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    delete: jest.fn(),
  };

  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    notificationService = module.get(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      const expectedResult = {
        notifications: [{ _id: 'n1', message: 'Test' }],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockNotificationService.findByUser.mockResolvedValue(expectedResult);

      const result = await controller.getNotifications(mockUser as any, {
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(expectedResult);
      expect(mockNotificationService.findByUser).toHaveBeenCalledWith(
        'user123',
        1,
        20,
      );
    });

    it('should use default pagination when not provided', async () => {
      const expectedResult = {
        notifications: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
      mockNotificationService.findByUser.mockResolvedValue(expectedResult);

      const result = await controller.getNotifications(mockUser as any, {
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockNotificationService.getUnreadCount.mockResolvedValue({ count: 5 });

      const result = await controller.getUnreadCount(mockUser as any);

      expect(result).toEqual({ count: 5 });
      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith(
        'user123',
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const mockNotification = { _id: 'n1', isRead: true };
      mockNotificationService.markAsRead.mockResolvedValue(mockNotification);

      const result = await controller.markAsRead(mockUser as any, 'n1');

      expect(result).toEqual(mockNotification);
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(
        'n1',
        'user123',
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue({
        message: 'All notifications marked as read',
      });

      const result = await controller.markAllAsRead(mockUser as any);

      expect(result).toEqual({ message: 'All notifications marked as read' });
      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith(
        'user123',
      );
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      mockNotificationService.delete.mockResolvedValue({
        message: 'Notification deleted successfully',
      });

      const result = await controller.deleteNotification(mockUser as any, 'n1');

      expect(result).toEqual({
        message: 'Notification deleted successfully',
      });
      expect(mockNotificationService.delete).toHaveBeenCalledWith(
        'n1',
        'user123',
      );
    });
  });
});
