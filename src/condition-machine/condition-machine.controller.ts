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
import { CreateConditionMachineDto } from './dto/create-condition-machine.dto';
import { UpdateConditionMachineDto } from './dto/update-condition-machine.dto';
import { ConditionMachineService } from './condition-machine.service';

@Controller('condition-machine')
@UseGuards(AuthGuard('jwt'))
export class ConditionMachineController {
  constructor(
    private readonly conditionMachineService: ConditionMachineService,
  ) {}
  @Get()
  async findAll(@Paginate() query: PaginateQuery, @Request() req) {
    return await this.conditionMachineService.findAll(query, req.user);
  }
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.conditionMachineService.findOne(id);
  }
  @Post()
  async create(
    @Body() createConditionMachineDto: CreateConditionMachineDto,
    @Request() req,
  ) {
    return await this.conditionMachineService.create(
      createConditionMachineDto,
      req.user,
    );
  }
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateConditionMachineDto: UpdateConditionMachineDto,
    @Request() req,
  ) {
    return await this.conditionMachineService.update(
      id,
      updateConditionMachineDto,
      req.user,
    );
  }

  @Delete(':id')
  async delete(
    @Param('id') id: number
  ) {
    return this.conditionMachineService.remove(id)    
  }
}
