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
} from '@nestjs/common';
import { NoPlanMachineService } from './no-plan-machine.service';
import { CreateNoPlanMachineDto } from './dto/create-no-plan-machine.dto';
import { UpdateNoPlanMachineDto } from './dto/update-no-plan-machine.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PermissionsGuard } from 'src/auth/guards/permission.guard';
import * as moment from 'moment';

@Controller('no-plan-machine')
export class NoPlanMachineController {
  constructor(private readonly noPlanMachineService: NoPlanMachineService) {}

  @UseGuards(AuthGuard('jwt'))
  @UseGuards(PermissionsGuard)
  @SetMetadata('permissions', ['CREATE:NOPLAN'])
  @Post()
  create(
    @Body(new ValidationPipe()) createNoPlanMachineDto: CreateNoPlanMachineDto,
    @Req() request: Request,
  ) {
    createNoPlanMachineDto.client_id = request.user['client'];
    const time_in = moment(createNoPlanMachineDto.time_in).format('HH:mm');
    const timein = moment(time_in, 'HH:mm');
    const time_out = moment(createNoPlanMachineDto.time_out).format('HH:mm');
    const timeout = moment(time_out, 'HH:mm');
    createNoPlanMachineDto.time_in = timein.toDate();
    createNoPlanMachineDto.time_out = timeout.toDate();

    return this.noPlanMachineService.create(createNoPlanMachineDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @UseGuards(PermissionsGuard)
  @SetMetadata('permissions', ['VIEW:NOPLAN'])
  @Get()
  findAll(@Req() request: Request) {
    return this.noPlanMachineService.findAll(request.user['client']);
  }

  @UseGuards(AuthGuard('jwt'))
  @UseGuards(PermissionsGuard)
  @SetMetadata('permissions', ['SHOW:NOPLAN'])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noPlanMachineService.findOne(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('shift/:shiftId')
  async findAllByShift(@Param("shiftId") shiftId: string) {
    return this.noPlanMachineService.findAllByShift(shiftId)
  }

  @UseGuards(AuthGuard('jwt'))
  @UseGuards(PermissionsGuard)
  @SetMetadata('permissions', ['UPDATE:NOPLAN'])
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateNoPlanMachineDto: UpdateNoPlanMachineDto,
    @Req() request: Request,
  ) {
    updateNoPlanMachineDto.client_id = request.user['client'];
    const time_in = moment(updateNoPlanMachineDto.time_in).format('HH:mm');
    const timein = moment(time_in, 'HH:mm');
    const time_out = moment(updateNoPlanMachineDto.time_out).format('HH:mm');
    const timeout = moment(time_out, 'HH:mm');
    updateNoPlanMachineDto.time_in = timein.toDate();
    updateNoPlanMachineDto.time_out = timeout.toDate();
    return this.noPlanMachineService.update(+id, updateNoPlanMachineDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @UseGuards(PermissionsGuard)
  @SetMetadata('permissions', ['DELETE:NOPLAN'])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noPlanMachineService.remove(+id);
  }
}
