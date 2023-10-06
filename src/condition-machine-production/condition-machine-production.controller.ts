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

@Controller('condition-machine-production')
@UseGuards(AuthGuard('jwt'))
export class ConditionMachineProductionController {
  constructor(
    private readonly conditionMachineProductionService: ConditionMachineProductionService,
  ) {}
}
