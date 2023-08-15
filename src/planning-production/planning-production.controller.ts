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
    return this.planningProductionService.create(createPlanningProductionDto);
  }

  @Get()
  findAll() {
    return this.planningProductionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planningProductionService.findOne(+id);
  }
}
