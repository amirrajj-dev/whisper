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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('unread-counts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get per-conversation unread message counts' })
  @ApiResponse({ status: 200, description: 'Unread counts per conversation' })
  async getUnreadCounts(@CurrentUser() user: Omit<User, 'password'>) {
    return this.chatService.getUnreadCounts(user._id);
  }

  @Get('conversations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user conversations (paginated)' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
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
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, description: 'Conversation details' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversationById(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getConversationById(user._id, conversationId);
  }

  @Get('messages/:conversationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get messages for a conversation (paginated)' })
  @ApiResponse({ status: 200, description: 'List of messages' })
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

  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('avatar', AVATAR_VALIDATION))
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests (max 5 per hour)',
  })
  async createConversation(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() data: CreateConversationDto,
    @UploadedFile() avatarFile?: Express.Multer.File,
  ) {
    return this.chatService.createConversation(user._id, data, avatarFile);
  }

  @Post('conversations/:id/participants')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add participants to a conversation' })
  @ApiResponse({ status: 201, description: 'Participants added successfully' })
  addParticipants(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id') conversationId: string,
    @Body() data: AddParticipantsDto,
  ) {
    return this.chatService.addParticipants(user._id, conversationId, data);
  }

  @Post('conversations/:conversationId/admins/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Promote a user to admin' })
  @ApiResponse({ status: 200, description: 'User promoted to admin' })
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
  @ApiOperation({ summary: 'Transfer conversation ownership' })
  @ApiResponse({ status: 200, description: 'Ownership transferred' })
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
  @ApiOperation({ summary: 'Send a message to a conversation' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() data: SendMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.chatService.sendMessage(user._id, data, file);
  }

  @Delete('conversations/:conversationId/admins/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demote a user from admin' })
  @ApiResponse({ status: 200, description: 'User demoted from admin' })
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
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  async deleteMessage(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id') messageId: string,
  ) {
    return this.chatService.deleteMessage(user._id, messageId);
  }

  @Delete('conversations/:id/participants/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a participant from conversation' })
  @ApiResponse({ status: 200, description: 'Participant removed' })
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
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  deleteConversation(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.deleteConversation(user._id, conversationId);
  }

  @Patch('conversations/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar', AVATAR_VALIDATION))
  @ApiOperation({ summary: 'Update conversation details' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Conversation updated' })
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
  @ApiOperation({ summary: 'Edit a message' })
  @ApiResponse({ status: 200, description: 'Message edited' })
  editMessage(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id') messageId: string,
    @Body() data: EditMessageDto,
  ) {
    return this.chatService.editMessage(user._id, messageId, data);
  }
}
