import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/common/types/user.type';
import { UpdateUserDto } from 'src/common/dtos/users/update-user.dto';
import { PaginationDto } from 'src/common/dtos/pagination/pagination.dto';
import { AVATAR_VALIDATION } from 'src/common/constants/upload.constants';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('')
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  getUsers(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query() pagination: PaginationDto,
  ) {
    return this.userService.getUsers(
      user._id,
      pagination.page,
      pagination.limit,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  getMe(@CurrentUser() user: Omit<User, 'password'>) {
    return user;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserById(@Param('id') id: string) {
    return this.userService.findUserById(id);
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Put('me')
  @UseInterceptors(FileInterceptor('avatar', AVATAR_VALIDATION))
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'User update data',
    type: UpdateUserDto,
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(
    @Body() data: UpdateUserDto,
    @CurrentUser() user: Omit<User, 'password'>,
    @UploadedFile() avatarFile?: Express.Multer.File,
  ) {
    return this.userService.updateUser(user._id, data, avatarFile);
  }

  @Post(':userId/block')
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({ status: 201, description: 'User blocked successfully' })
  blockUser(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('userId') targetUserId: string,
  ) {
    return this.userService.blockUser(user._id, targetUserId);
  }

  @Delete(':userId/block')
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  unblockUser(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('userId') targetUserId: string,
  ) {
    return this.userService.unblockUser(user._id, targetUserId);
  }
}
