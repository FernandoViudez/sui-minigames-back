import { IsDefined, IsNumber, IsString, Max, Min } from 'class-validator';

export class TurnOverCardDto {
  @IsDefined()
  @IsString()
  readonly roomId: string;
  @IsNumber()
  @IsDefined()
  @Min(1)
  @Max(16)
  readonly position: number;
}
