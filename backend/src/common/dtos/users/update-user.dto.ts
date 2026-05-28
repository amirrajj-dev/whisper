import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(20)
  username?: string;
  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(70)
  bio?: string;
}
