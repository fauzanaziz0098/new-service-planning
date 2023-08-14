import { Shift } from 'src/shift/entities/shift.entity';
import { IsNotEmpty } from 'class-validator';

export class CreateNoPlanMachineDto {
  @IsNotEmpty()
  shift: Shift;

  @IsNotEmpty()
  time_in: Date;

  @IsNotEmpty()
  time_out: Date;

  total: number;
}
