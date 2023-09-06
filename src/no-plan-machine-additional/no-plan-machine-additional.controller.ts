import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NoPlanMachineAdditionalService } from './no-plan-machine-additional.service';
import { CreateNoPlanMachineAdditionalDto } from './dto/create-no-plan-machine-additional.dto';
import { UpdateNoPlanMachineAdditionalDto } from './dto/update-no-plan-machine-additional.dto';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('no-plan-machine-additional')
export class NoPlanMachineAdditionalController {
  constructor(
    private readonly noPlanMachineAdditionalService: NoPlanMachineAdditionalService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @Body() createNoPlanMachineAdditionalDto: CreateNoPlanMachineAdditionalDto,
    @Req() req: Request,
  ) {
    createNoPlanMachineAdditionalDto.client_id = req.user['client'];
    return this.noPlanMachineAdditionalService.create(
      createNoPlanMachineAdditionalDto,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Req() req: Request) {
    return this.noPlanMachineAdditionalService.findAll(req.user['client']);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noPlanMachineAdditionalService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNoPlanMachineAdditionalDto: UpdateNoPlanMachineAdditionalDto,
  ) {
    return this.noPlanMachineAdditionalService.update(
      +id,
      updateNoPlanMachineAdditionalDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noPlanMachineAdditionalService.remove(+id);
  }
}
