import { IsNotEmpty } from 'class-validator';
import { PlanningProduction } from 'src/planning-production/entities/planning-production.entity';
import { Machine } from 'src/machine/entities/machine.entity';

export class CreatePresenceDto {
  client_id: string;

  // @IsNotEmpty()
  operator: string;

  @IsNotEmpty()
  planning_production: PlanningProduction;

  machine: Machine;

  is_absen?: boolean;

  card_number?: string;
}
