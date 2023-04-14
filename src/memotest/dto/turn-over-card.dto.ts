import { IsDefined, IsNumber, Max, Min } from 'class-validator';

export class TurnOverCardDto {
  @IsNumber()
  @IsDefined()
  @Min(1)
  @Max(16)
  readonly position: number;
}
