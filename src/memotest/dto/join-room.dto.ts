import { IsDefined, IsString } from 'class-validator';

export class JoinRoomDto {
  @IsDefined()
  @IsString()
  readonly roomId: string;
  @IsDefined()
  @IsString()
  readonly signature: string;
}
