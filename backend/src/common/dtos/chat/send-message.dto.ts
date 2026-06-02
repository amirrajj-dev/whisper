import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  VIDEO = 'video',
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Conversation ID to send the message to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  type: 'text' | 'image' | 'file' | 'voice' | 'video';

  @ApiPropertyOptional({
    description: 'Message content (text for text type, otherwise optional)',
    example: 'Hello, how are you?',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content: string;

  @ApiPropertyOptional({
    description: 'ID of the message being replied to',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsString()
  replyTo?: string;
}
