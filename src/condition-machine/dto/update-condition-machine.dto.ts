import { PartialType } from '@nestjs/mapped-types';
import { CreateConditionMachineDto } from './create-condition-machine.dto';

export class UpdateConditionMachineDto extends PartialType(
  CreateConditionMachineDto,
) {}
