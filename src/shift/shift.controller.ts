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
    return this.shiftService.create(createShiftDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.shiftService.findAll();
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
  ) {
    return this.shiftService.update(+id, updateShiftDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftService.remove(+id);
  }
}
