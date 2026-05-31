import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsEnum(['text', 'image', 'file', 'voice', 'video'])
  type: 'text' | 'image' | 'file' | 'voice' | 'video';

  @IsNotEmpty()
  @IsString()
  content: string;
  @IsOptional()
  @IsString()
  replyTo?: string;
}
