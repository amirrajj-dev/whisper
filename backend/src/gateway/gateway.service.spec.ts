import { Test, TestingModule } from '@nestjs/testing';
import { GatewayService } from './gateway.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('GatewayService', () => {
  let service: GatewayService;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockEventEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewayService,
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<GatewayService>(GatewayService);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should register all chat event listeners', () => {
      service.onModuleInit();

      const expectedEvents = [
        'chat.message.sent',
        'chat.message.edited',
        'chat.message.deleted',
        'chat.message.read',
        'chat.conversation.created',
        'chat.conversation.updated',
        'chat.conversation.deleted',
        'chat.participant.added',
        'chat.participant.removed',
        'chat.participant.role.changed',
        'chat.ownership.transferred',
      ];

      for (const event of expectedEvents) {
        expect(mockEventEmitter.on).toHaveBeenCalledWith(
          event,
          expect.any(Function),
        );
      }
    });
  });

  describe('registerSocket / unregisterSocket', () => {
    it('should register a socket for a user', () => {
      service.registerSocket('user1', 'socket1');
      expect(service.isUserOnline('user1')).toBe(true);
    });

    it('should register multiple sockets for the same user', () => {
      service.registerSocket('user1', 'socket1');
      service.registerSocket('user1', 'socket2');
      expect(service.isUserOnline('user1')).toBe(true);
    });

    it('should unregister a socket and keep user online if other sockets exist', () => {
      service.registerSocket('user1', 'socket1');
      service.registerSocket('user1', 'socket2');

      const result = service.unregisterSocket('socket1');
      expect(result).toBe('user1');
      expect(service.isUserOnline('user1')).toBe(true);
    });

    it('should mark user offline when last socket is unregistered', () => {
      service.registerSocket('user1', 'socket1');

      const result = service.unregisterSocket('socket1');
      expect(result).toBe('user1');
      expect(service.isUserOnline('user1')).toBe(false);
    });

    it('should return null for unknown socket', () => {
      const result = service.unregisterSocket('unknown');
      expect(result).toBeNull();
    });
  });

  describe('setServer', () => {
    it('should set server reference', () => {
      const mockServer = { to: jest.fn() } as any;
      service.setServer(mockServer);
      expect((service as any).server).toBe(mockServer);
    });
  });

  describe('getOnlineUsers', () => {
    it('should return online status for a list of userIds', () => {
      service.registerSocket('user1', 'socket1');
      service.registerSocket('user2', 'socket2');
      service.registerSocket('user2', 'socket3');

      const result = service.getOnlineUsers(['user1', 'user2', 'user3']);

      expect(result).toEqual({
        user1: true,
        user2: true,
        user3: false,
      });
    });
  });

  describe('getConnectionStats', () => {
    it('should return correct connection statistics', () => {
      service.registerSocket('user1', 'socket1');
      service.registerSocket('user2', 'socket2');
      service.registerSocket('user2', 'socket3');

      const result = service.getConnectionStats();

      expect(result).toEqual({ onlineUsers: 2, activeSockets: 3 });
    });

    it('should return zero stats when no connections exist', () => {
      const result = service.getConnectionStats();
      expect(result).toEqual({ onlineUsers: 0, activeSockets: 0 });
    });
  });

  describe('emitToUser', () => {
    it('should emit event to all sockets of a user', () => {
      const mockServer = {
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      } as any;
      service.setServer(mockServer);
      service.registerSocket('user1', 'socket1');
      service.registerSocket('user1', 'socket2');

      service.emitToUser('user1', 'test:event', { data: 'test' });

      expect(mockServer.to).toHaveBeenCalledWith('socket1');
      expect(mockServer.to).toHaveBeenCalledWith('socket2');
    });

    it('should not emit if server is not set', () => {
      service.registerSocket('user1', 'socket1');
      expect(() =>
        service.emitToUser('user1', 'test:event', { data: 'test' }),
      ).not.toThrow();
    });
  });
});
