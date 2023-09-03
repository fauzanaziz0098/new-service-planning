import { PartialType } from '@nestjs/mapped-types';
import { CreateNoPlanMachineAdditionalDto } from './create-no-plan-machine-additional.dto';

export class UpdateNoPlanMachineAdditionalDto extends PartialType(CreateNoPlanMachineAdditionalDto) {}
