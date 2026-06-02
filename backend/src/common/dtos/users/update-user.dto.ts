import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'New username',
    example: 'johndoe',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(20)
  username?: string;

  @ApiPropertyOptional({
    description: 'New email address',
    example: 'newemail@example.com',
  })
  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User bio',
    example: 'Software developer and coffee enthusiast',
    maxLength: 70,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(70)
  bio?: string;
}
