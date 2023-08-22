import { Shift } from 'src/shift/entities/shift.entity';
import { IsNotEmpty } from 'class-validator';

export class CreateNoPlanMachineDto {
  client_id: string;

  active_plan: boolean;

  @IsNotEmpty()
  shift: Shift;

  @IsNotEmpty()
  time_in: Date;

  @IsNotEmpty()
  time_out: Date;

  total: number;
}
