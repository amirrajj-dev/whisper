import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.gurad';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/common/types/user.type';
import { UpdateUserDto } from 'src/common/dtos/users/update-user.dto';
import { PaginationDto } from 'src/common/dtos/pagination/pagination.dto';
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

  @Put('me')
  async updateUser(
    @Body() data: UpdateUserDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.userService.updateUser(user._id, data);
  }
}
