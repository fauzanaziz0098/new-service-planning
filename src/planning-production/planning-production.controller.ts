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
import { Paginate, PaginateQuery } from 'nestjs-paginate';

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

  @Post('active-plan-api')
  getActiveAPI(@Body('client') client: string) {
    return this.planningProductionService.getPlanningProduction(client);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('stop-planning-production')
  stopPlanning(@Req() req: Request) {
    return this.planningProductionService.stopPlanningProduction(
      req.user['client'],
      req.headers.authorization,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('last-planning')
  getLastPlanning(@Req() request: Request) {
    return this.planningProductionService.getLastPlanning(
      request.user['client'],
    );
  }

  @Get("find-all-active")
  getAllActivePlan() {
    return this.planningProductionService.getPlanningActiveAll()
  }

  @UseGuards(AuthGuard('jwt'))
  @Get("get-all-data")
  getAllData(@Paginate() query: PaginateQuery,@Req() req: Request) {
    return this.planningProductionService.getAllData(query,req.user['client'])
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(":id")
  async updateQtyReject(@Param("id") id: string, @Body() updatePlanningProductionDto: UpdatePlanningProductionDto) {
    return this.planningProductionService.updateQtyReject(id, updatePlanningProductionDto)
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(":id")
  async findOne(@Param("id") id: any) {
    return this.planningProductionService.findOne(id)    
  }
  
  @Get('all-plan-client/:client')
  async getAllPlanByClient(@Paginate() query: PaginateQuery, @Param('client') client) {
    return this.planningProductionService.getAllPlanByClient(query, client)
  }
}
