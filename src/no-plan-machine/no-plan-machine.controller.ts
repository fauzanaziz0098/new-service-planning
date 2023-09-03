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
  @UseGuards(PermissionsGuard)
  @SetMetadata('permissions', ['UPDATE:NOPLAN'])
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateNoPlanMachineDto: UpdateNoPlanMachineDto,
  ) {
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
