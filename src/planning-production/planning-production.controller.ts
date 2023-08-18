import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PlanningProductionService } from './planning-production.service';
import { CreatePlanningProductionDto } from './dto/create-planning-production.dto';
import { UpdatePlanningProductionDto } from './dto/update-planning-production.dto';
import { ValidationPipe } from '@nestjs/common';

@Controller('planning-production')
export class PlanningProductionController {
  constructor(
    private readonly planningProductionService: PlanningProductionService,
  ) {}

  @Post()
  createPlanning(
    @Body(new ValidationPipe())
    createPlanningProductionDto: CreatePlanningProductionDto,
  ) {
    return this.planningProductionService.createPlanningProduction(
      createPlanningProductionDto,
    );
  }

  @Get()
  findActive() {
    return this.planningProductionService.getPlanningProduction();
  }

  @Post('stop-planning-production')
  stopPlanning() {
    return this.planningProductionService.stopPlanningProduction();
  }
}
