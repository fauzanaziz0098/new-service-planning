import { IsNotEmpty } from 'class-validator';
export class CreateShiftDto {
  client_id: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  time_start: Date;

  @IsNotEmpty()
  time_end: Date;
}
