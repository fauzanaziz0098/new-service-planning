import { ConditionMachine } from 'src/condition-machine/entities/condition-machine.entity';
import { StatusType } from '../entities/condition-machine-production.entity';

export class CreateConditionMachineProductionDto {
  conditionMachine: ConditionMachine;
  cleintId?: string;
  planningId?: number;
  status?: StatusType;
}
