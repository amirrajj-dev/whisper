import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ConversationType {
  PRIVATE = 'private',
  GROUP = 'group',
}

export class CreateConversationDto {
  @ApiProperty({
    description: 'Conversation type',
    enum: ConversationType,
    example: ConversationType.PRIVATE,
  })
  @IsEnum(ConversationType)
  type: 'private' | 'group';

  @ApiProperty({
    description: 'Array of participant user IDs',
    example: ['507f1f77bcf86cd799439011'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  participants: string[];

  @ApiPropertyOptional({
    description: 'Group conversation name (required for group type)',
    example: 'My Group',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
