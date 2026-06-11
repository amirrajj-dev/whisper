import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnregisterDeviceDto {
  @ApiProperty({ description: 'Expo push token to unregister' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
