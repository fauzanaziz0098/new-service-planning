import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PlanningProductionReportService } from './planning-production-report.service';
import { CreatePlanningProductionReportDto } from './dto/create-planning-production-report.dto';
import { UpdatePlanningProductionReportDto } from './dto/update-planning-production-report.dto';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { AuthGuard } from '@nestjs/passport';

@Controller('planning-production-report')
export class PlanningProductionReportController {
  constructor(
    private readonly planningProductionReportService: PlanningProductionReportService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  getReport(@Paginate() query: PaginateQuery) {
    return this.planningProductionReportService.getReport(query);
  }
}
