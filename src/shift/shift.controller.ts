import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ShiftService } from './shift.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import * as moment from 'moment';

@Controller('shift')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @Body(new ValidationPipe()) createShiftDto: CreateShiftDto,
    @Req() request: Request,
  ) {
    createShiftDto.client_id = request.user['client'];
    const time_start = moment(createShiftDto.time_start).format('HH:mm');
    const timeStart = moment(time_start, 'HH:mm');
    const time_end = moment(createShiftDto.time_end).format('HH:mm');
    const timeEnd = moment(time_end, 'HH:mm');
    createShiftDto.time_start = timeStart.toDate();
    createShiftDto.time_end = timeEnd.toDate();

    return this.shiftService.create(createShiftDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Req() request: Request) {
    return this.shiftService.findAll(request.user['client']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftService.findOne(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateShiftDto: UpdateShiftDto,
    @Req() req: Request,
  ) {
    updateShiftDto.client_id = req.user['client'];
    const time_start = moment(updateShiftDto.time_start).format('HH:mm');
    const timeStart = moment(time_start, 'HH:mm');
    const time_end = moment(updateShiftDto.time_end).format('HH:mm');
    const timeEnd = moment(time_end, 'HH:mm');
    updateShiftDto.time_start = timeStart.toDate();
    updateShiftDto.time_end = timeEnd.toDate();

    return this.shiftService.update(+id, updateShiftDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftService.remove(+id);
  }
}
