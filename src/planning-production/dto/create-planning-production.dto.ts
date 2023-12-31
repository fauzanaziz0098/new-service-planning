import { IsNotEmpty, IsNumber } from 'class-validator';
import { Machine } from 'src/machine/entities/machine.entity';
import { Product } from 'src/product/entities/product.entity';
import { Shift } from 'src/shift/entities/shift.entity';
import { PlanningProduction } from '../entities/planning-production.entity';

export class CreatePlanningProductionDto {
  client_id: string;

  active_plan: boolean;

  @IsNotEmpty()
  machine: Machine;

  @IsNotEmpty()
  product: Product;

  @IsNotEmpty()
  shift: Shift;

  @IsNotEmpty()
  @IsNumber()
  qty_planning: number;

  qty_per_hour: number;

  qty_per_minute: number;

  date_time_in: Date;

  date_time_out: Date;

  qty_reject: number;

  total_time_actual: number;

  total_time_planning: number;

  remark: string;

  dandory_time: number;

  @IsNotEmpty()
  user: string;

  // additional
  time_in?: Date;
  time_out?: Date;
}
