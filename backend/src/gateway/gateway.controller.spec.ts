import { Test, TestingModule } from '@nestjs/testing';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.gurad';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('GatewayController', () => {
  let controller: GatewayController;
  let gatewayService: jest.Mocked<GatewayService>;

  const mockGatewayService = {
    isUserOnline: jest.fn(),
    getOnlineUsers: jest.fn(),
    getConnectionStats: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayController],
      providers: [
        { provide: GatewayService, useValue: mockGatewayService },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn(), on: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<GatewayController>(GatewayController);
    gatewayService = module.get(GatewayService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkOnline', () => {
    it('should return online status for a given userId', async () => {
      mockGatewayService.isUserOnline.mockReturnValue(true);

      const result = await controller.checkOnline('user123');

      expect(result).toEqual({ userId: 'user123', online: true });
      expect(mockGatewayService.isUserOnline).toHaveBeenCalledWith('user123');
    });

    it('should return offline status when user is not connected', async () => {
      mockGatewayService.isUserOnline.mockReturnValue(false);

      const result = await controller.checkOnline('user456');

      expect(result).toEqual({ userId: 'user456', online: false });
      expect(mockGatewayService.isUserOnline).toHaveBeenCalledWith('user456');
    });
  });

  describe('checkOnlineBatch', () => {
    it('should return online status for multiple users', async () => {
      const userIds = ['user1', 'user2', 'user3'];
      mockGatewayService.getOnlineUsers.mockReturnValue({
        user1: true,
        user2: false,
        user3: true,
      });

      const result = await controller.checkOnlineBatch(userIds);

      expect(result).toEqual({
        status: { user1: true, user2: false, user3: true },
      });
      expect(mockGatewayService.getOnlineUsers).toHaveBeenCalledWith(userIds);
    });

    it('should return empty status for empty userIds array', async () => {
      mockGatewayService.getOnlineUsers.mockReturnValue({});

      const result = await controller.checkOnlineBatch([]);

      expect(result).toEqual({ status: {} });
    });
  });

  describe('getStats', () => {
    it('should return connection statistics', async () => {
      mockGatewayService.getConnectionStats.mockReturnValue({
        onlineUsers: 5,
        activeSockets: 8,
      });

      const result = await controller.getStats();

      expect(result).toEqual({ onlineUsers: 5, activeSockets: 8 });
      expect(mockGatewayService.getConnectionStats).toHaveBeenCalled();
    });
  });
});
