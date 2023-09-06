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
  findActive(@Req() req: Request) {
    return this.planningProductionService.getPlanningProduction(
      req.user['client'],
    );
  }
  @Get('active-plan-api')
  getActiveAPI(client: string) {
    return this.planningProductionService.getPlanningProduction(client);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('stop-planning-production')
  stopPlanning(@Req() req: Request) {
    return this.planningProductionService.stopPlanningProduction(
      req.user['client'],
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('last-planning')
  getLastPlanning(@Req() request: Request) {
    return this.planningProductionService.getLastPlanning(
      request.user['client'],
    );
  }
}
