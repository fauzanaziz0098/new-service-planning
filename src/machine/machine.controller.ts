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
  findAll(@Paginate() query: PaginateQuery, @Req() req: Request) {
    return this.machineService.findAll(query, req.user['client']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('all-machines')
  getAll(@Req() req: Request) {
    return this.machineService.getAll(req.user['client']);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.machineService.findOne(+id, req.user['client']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateMachineDto: UpdateMachineDto,
    @Req() req: Request,
  ) {
    return this.machineService.update(
      +id,
      updateMachineDto,
      req.user['client'],
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.machineService.remove(+id, req.user['client']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('delete/many')
  async removeMany(@Body('ids') ids: string[], @Req() req: Request) {
    return this.machineService.removeMany(ids, req.user['client']);
  }
}
