import { IsDefined, IsString } from 'class-validator';

export class StartGameDto {
  @IsDefined()
  @IsString()
  readonly roomId: string;
}
