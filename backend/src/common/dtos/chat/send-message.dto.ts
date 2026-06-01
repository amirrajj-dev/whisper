import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  VIDEO = 'video',
}

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsEnum(MessageType)
  type: 'text' | 'image' | 'file' | 'voice' | 'video';

  @IsOptional()
  @IsString()
  content: string;
  @IsOptional()
  @IsString()
  replyTo?: string;
}
