import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Delete,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.gurad';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/common/types/user.type';
import { ChatService } from './chat.service';
import { PaginationDto } from 'src/common/dtos/pagination/pagination.dto';
import { CreateConversationDto } from 'src/common/dtos/chat/create-conversation.dto';
import { SendMessageDto } from 'src/common/dtos/chat/send-message.dto';
import {
  AVATAR_VALIDATION,
  FILE_VALIDATION,
} from 'src/common/constants/upload.constants';
import { AddParticipantsDto } from 'src/common/dtos/chat/add-participants.dto';
import { Throttle } from '@nestjs/throttler';
import { UpdateConversationDto } from 'src/common/dtos/chat/update-conversation.dto';
import { EditMessageDto } from 'src/common/dtos/chat/edit-message.dto';
import { TransferOwnershipDto } from 'src/common/dtos/chat/transfer-ownership.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @HttpCode(HttpStatus.OK)
  async getUserConversations(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query() pagination: PaginationDto,
  ) {
    return this.chatService.getUserConversations(
      user._id,
      pagination.page,
      pagination.limit,
    );
  }

  @Get('conversations/:id')
  @HttpCode(HttpStatus.OK)
  async getConversationById(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getConversationById(user._id, conversationId);
  }

  @Get('messages/:conversationId')
  @HttpCode(HttpStatus.OK)
  async getMessages(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('conversationId') conversationId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.chatService.getMessages(
      user._id,
      conversationId,
      pagination.page,
      pagination.limit,
    );
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('avatar', AVATAR_VALIDATION))
  async createConversation(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() data: CreateConversationDto,
    @UploadedFile() avatarFile?: Express.Multer.File,
  ) {
    return this.chatService.createConversation(user._id, data, avatarFile);
  }

  @Post('conversations/:id/participants')
  @HttpCode(HttpStatus.CREATED)
  addParticipants(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id') conversationId: string,
    @Body() data: AddParticipantsDto,
  ) {
    return this.chatService.addParticipants(user._id, conversationId, data);
  }

  @Post('conversations/:conversationId/admins/:userId')
  @HttpCode(HttpStatus.OK)
  promoteToAdmin(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('conversationId') conversationId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.chatService.promoteToAdmin(
      user._id,
      conversationId,
      targetUserId,
    );
  }

  @Post('conversations/:conversationId/owner')
  @HttpCode(HttpStatus.OK)
  transferOwnership(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('conversationId') conversationId: string,
    @Body() data: TransferOwnershipDto,
  ) {
    return this.chatService.transferOwnership(
      user._id,
      conversationId,
      data.newOwnerId,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('messages')
  @UseInterceptors(FileInterceptor('file', FILE_VALIDATION))
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() data: SendMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.chatService.sendMessage(user._id, data, file);
  }

  @Delete('conversations/:conversationId/admins/:userId')
  @HttpCode(HttpStatus.OK)
  demoteFromAdmin(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('conversationId') conversationId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.chatService.demoteFromAdmin(
      user._id,
      conversationId,
      targetUserId,
    );
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.OK)
  async deleteMessage(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id') messageId: string,
  ) {
    return this.chatService.deleteMessage(user._id, messageId);
  }

  @Delete('conversations/:id/participants/:userId')
  @HttpCode(HttpStatus.OK)
  removeParticipant(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id') conversationId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.chatService.removeParticipant(
      user._id,
      conversationId,
      targetUserId,
    );
  }

  @Delete('conversations/:conversationId')
  @HttpCode(HttpStatus.OK)
  deleteConversation(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.deleteConversation(user._id, conversationId);
  }

  @Patch('conversations/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar', AVATAR_VALIDATION))
  updateConversation(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id') conversationId: string,
    @Body() data: UpdateConversationDto,
    @UploadedFile() avatarFile?: Express.Multer.File,
  ) {
    return this.chatService.updateConversation(
      user._id,
      conversationId,
      data,
      avatarFile,
    );
  }

  @Patch('messages/:id')
  @HttpCode(HttpStatus.OK)
  editMessage(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id') messageId: string,
    @Body() data: EditMessageDto,
  ) {
    return this.chatService.editMessage(user._id, messageId, data);
  }
}
