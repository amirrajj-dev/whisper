import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditMessageDto {
  @ApiProperty({
    description: 'Updated message content',
    example: 'This is the edited message',
    maxLength: 4000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(4000)
  content: string;
}
