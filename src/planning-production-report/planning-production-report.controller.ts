import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PlanningProductionReportService } from './planning-production-report.service';
import { CreatePlanningProductionReportDto } from './dto/create-planning-production-report.dto';
import { UpdatePlanningProductionReportDto } from './dto/update-planning-production-report.dto';
import { Paginate, PaginateQuery } from 'nestjs-paginate';

@Controller('planning-production-report')
export class PlanningProductionReportController {
  constructor(
    private readonly planningProductionReportService: PlanningProductionReportService,
  ) {}

  @Get()
  getReport(@Paginate() query: PaginateQuery) {
    return this.planningProductionReportService.getReport(query);
  }
}
