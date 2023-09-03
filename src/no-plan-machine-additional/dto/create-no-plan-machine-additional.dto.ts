import { IsNotEmpty } from 'class-validator';
import { PlanningProduction } from 'src/planning-production/entities/planning-production.entity';

export class CreateNoPlanMachineAdditionalDto {
  client_id: string;

  // @IsNotEmpty()
  planning_production: PlanningProduction;

  @IsNotEmpty()
  time_in: Date;

  @IsNotEmpty()
  time_out: Date;

  total: number;
}
