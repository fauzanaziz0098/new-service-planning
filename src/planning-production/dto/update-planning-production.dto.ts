import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanningProductionDto } from './create-planning-production.dto';

export class UpdatePlanningProductionDto extends PartialType(CreatePlanningProductionDto) {}
