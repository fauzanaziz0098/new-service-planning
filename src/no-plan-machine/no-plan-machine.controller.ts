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
import { NoPlanMachineService } from './no-plan-machine.service';
import { CreateNoPlanMachineDto } from './dto/create-no-plan-machine.dto';
import { UpdateNoPlanMachineDto } from './dto/update-no-plan-machine.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('no-plan-machine')
export class NoPlanMachineController {
  constructor(private readonly noPlanMachineService: NoPlanMachineService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @Body(new ValidationPipe()) createNoPlanMachineDto: CreateNoPlanMachineDto,
    @Req() request: Request,
  ) {
    createNoPlanMachineDto.client_id = request.user['client'];
    return this.noPlanMachineService.create(createNoPlanMachineDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.noPlanMachineService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noPlanMachineService.findOne(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateNoPlanMachineDto: UpdateNoPlanMachineDto,
  ) {
    return this.noPlanMachineService.update(+id, updateNoPlanMachineDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noPlanMachineService.remove(+id);
  }
}
