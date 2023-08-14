import { IsNotEmpty } from 'class-validator';
export class CreateShiftDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  time_start: Date;

  @IsNotEmpty()
  time_end: Date;
}
