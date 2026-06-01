import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const mockUserService = {
    getUsers: jest.fn(),
    findUserById: jest.fn(),
    updateUser: jest.fn(),
    blockUser: jest.fn(),
    unblockUser: jest.fn(),
  };

  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const expected = { users: [], total: 0, page: 1, totalPages: 0 };
      mockUserService.getUsers.mockReturnValue(expected);

      const result = controller.getUsers(mockUser as any, {
        page: 1,
        limit: 20,
      });

      expect(result).toBe(expected);
      expect(mockUserService.getUsers).toHaveBeenCalledWith('user123', 1, 20);
    });
  });

  describe('getMe', () => {
    it('should return the current user', () => {
      const result = controller.getMe(mockUser as any);

      expect(result).toBe(mockUser);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const expected = { _id: 'user456', username: 'other' };
      mockUserService.findUserById.mockResolvedValue(expected);

      const result = await controller.getUserById('user456');

      expect(result).toBe(expected);
      expect(mockUserService.findUserById).toHaveBeenCalledWith('user456');
    });
  });

  describe('updateUser', () => {
    it('should update user profile', async () => {
      const dto = { username: 'newname' };
      const expected = { _id: 'user123', username: 'newname' };
      mockUserService.updateUser.mockResolvedValue(expected);

      const result = await controller.updateUser(
        dto,
        mockUser as any,
        undefined,
      );

      expect(result).toBe(expected);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        'user123',
        dto,
        undefined,
      );
    });
  });

  describe('blockUser', () => {
    it('should block a user', async () => {
      const expected = { message: 'User blocked successfully' };
      mockUserService.blockUser.mockReturnValue(expected);

      const result = controller.blockUser(mockUser as any, 'user456');

      expect(result).toBe(expected);
      expect(mockUserService.blockUser).toHaveBeenCalledWith(
        'user123',
        'user456',
      );
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user', async () => {
      const expected = { message: 'User unblocked successfully' };
      mockUserService.unblockUser.mockReturnValue(expected);

      const result = controller.unblockUser(mockUser as any, 'user456');

      expect(result).toBe(expected);
      expect(mockUserService.unblockUser).toHaveBeenCalledWith(
        'user123',
        'user456',
      );
    });
  });
});
