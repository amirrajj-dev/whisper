import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EditMessageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(4000)
  content: string;
}
