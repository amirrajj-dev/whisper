import { IsNotEmpty, IsString } from 'class-validator';

export class TransferOwnershipDto {
  @IsNotEmpty()
  @IsString()
  newOwnerId: string;
}
