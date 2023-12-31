import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UseGuards,
  Req,
  SetMetadata,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { ConditionMachineProductionService } from './condition-machine-production.service';
import { StatusType } from './entities/condition-machine-production.entity';

@Controller('condition-machine-production')
@UseGuards(AuthGuard('jwt'))
export class ConditionMachineProductionController {
  constructor(
    private readonly conditionMachineProductionService: ConditionMachineProductionService,
  ) {}
  
  @Get(':machineId')
  async findAll(@Paginate() query: PaginateQuery, @Request() req, @Param('machineId') machineId) {
    return await this.conditionMachineProductionService.findAll(query, req.user, machineId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body('status') status: StatusType,
    @Request() req,
  ) {
    return await this.conditionMachineProductionService.updateByApi(id, req.user, {
      status,
    });
  }
}
