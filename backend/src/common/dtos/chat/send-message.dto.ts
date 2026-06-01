import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

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
  @MaxLength(4000)
  content: string;
  @IsOptional()
  @IsString()
  replyTo?: string;
}
