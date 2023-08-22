import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanningProductionReportDto } from './create-planning-production-report.dto';

export class UpdatePlanningProductionReportDto extends PartialType(CreatePlanningProductionReportDto) {}
