import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';

export enum ConversationType {
  PRIVATE = 'private',
  GROUP = 'group',
}

export class CreateConversationDto {
  @IsEnum(ConversationType)
  type: 'private' | 'group';

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  participants: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
