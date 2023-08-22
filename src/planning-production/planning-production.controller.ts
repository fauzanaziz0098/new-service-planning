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
import { PlanningProductionService } from './planning-production.service';
import { CreatePlanningProductionDto } from './dto/create-planning-production.dto';
import { UpdatePlanningProductionDto } from './dto/update-planning-production.dto';
import { ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('planning-production')
export class PlanningProductionController {
  constructor(
    private readonly planningProductionService: PlanningProductionService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  createPlanning(
    @Body(new ValidationPipe())
    createPlanningProductionDto: CreatePlanningProductionDto,
    @Req() request: Request,
  ) {
    createPlanningProductionDto.client_id = request.user['client'];
    return this.planningProductionService.createPlanningProduction(
      createPlanningProductionDto,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findActive() {
    return this.planningProductionService.getPlanningProduction();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('stop-planning-production')
  stopPlanning() {
    return this.planningProductionService.stopPlanningProduction();
  }
}
