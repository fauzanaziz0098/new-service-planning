import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PlanningProductionReportService } from './planning-production-report.service';
import { CreatePlanningProductionReportDto } from './dto/create-planning-production-report.dto';
import { UpdatePlanningProductionReportDto } from './dto/update-planning-production-report.dto';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

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

  @UseGuards(AuthGuard('jwt'))
  @Get('report-oee')
  reportOee(@Req() req: Request) {
    return this.planningProductionReportService.reportOee(req.user['client']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('report-oee-monthly')
  reportOeeMonthly(@Req() req: Request) {
    return this.planningProductionReportService.monthly(req.user['client']);
  }
}
