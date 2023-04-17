import { IsString, IsDefined, IsBoolean } from 'class-validator';

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
  @IsBoolean()
  @IsDefined()
  readonly isPrivate: boolean;
}
