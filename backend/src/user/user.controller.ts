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
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('')
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
  getMe(@CurrentUser() user: Omit<User, 'password'>) {
    return user;
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.userService.findUserById(id);
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 per hour
  @Put('me')
  @UseInterceptors(FileInterceptor('avatar', AVATAR_VALIDATION))
  async updateUser(
    @Body() data: UpdateUserDto,
    @CurrentUser() user: Omit<User, 'password'>,
    @UploadedFile() avatarFile?: Express.Multer.File,
  ) {
    return this.userService.updateUser(user._id, data, avatarFile);
  }

  @Post(':userId/block')
  blockUser(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('userId') targetUserId: string,
  ) {
    return this.userService.blockUser(user._id, targetUserId);
  }

  @Delete(':userId/block')
  unblockUser(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('userId') targetUserId: string,
  ) {
    return this.userService.unblockUser(user._id, targetUserId);
  }
}
