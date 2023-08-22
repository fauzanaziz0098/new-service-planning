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
} from '@nestjs/common';
import { MachineService } from './machine.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('machine')
export class MachineController {
  constructor(private readonly machineService: MachineService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @Body(new ValidationPipe()) createMachineDto: CreateMachineDto,
    @Req() request: Request,
  ) {
    createMachineDto.client_id = request.user['client'];
    return this.machineService.create(createMachineDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Paginate() query: PaginateQuery) {
    return this.machineService.findAll(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('all-machines')
  getAll() {
    return this.machineService.getAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.machineService.findOne(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateMachineDto: UpdateMachineDto,
  ) {
    return this.machineService.update(+id, updateMachineDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.machineService.remove(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('delete/many')
  async removeMany(@Body('ids') ids: string[]) {
    return this.machineService.removeMany(ids);
  }
}
