import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Current password to confirm account deletion',
    example: 'securePassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
