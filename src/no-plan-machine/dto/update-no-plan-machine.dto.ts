import { PartialType } from '@nestjs/mapped-types';
import { CreateNoPlanMachineDto } from './create-no-plan-machine.dto';

export class UpdateNoPlanMachineDto extends PartialType(CreateNoPlanMachineDto) {}
