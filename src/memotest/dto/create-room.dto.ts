import { IsString, IsDefined } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsDefined()
  readonly signature: string;
  @IsString()
  @IsDefined()
  readonly publicKey: string;
  @IsString()
  @IsDefined()
  readonly gameBoardObjectId: string;
}
