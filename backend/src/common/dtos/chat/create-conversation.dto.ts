import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';

export class CreateConversationDto {
  @IsEnum(['private', 'group'])
  type: 'private' | 'group';

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  participants: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
