import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
} from '@nestjs/common';
import { NoPlanMachineService } from './no-plan-machine.service';
import { CreateNoPlanMachineDto } from './dto/create-no-plan-machine.dto';
import { UpdateNoPlanMachineDto } from './dto/update-no-plan-machine.dto';

@Controller('no-plan-machine')
export class NoPlanMachineController {
  constructor(private readonly noPlanMachineService: NoPlanMachineService) {}

  @Post()
  create(
    @Body(new ValidationPipe()) createNoPlanMachineDto: CreateNoPlanMachineDto,
  ) {
    return this.noPlanMachineService.create(createNoPlanMachineDto);
  }

  @Get()
  findAll() {
    return this.noPlanMachineService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noPlanMachineService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateNoPlanMachineDto: UpdateNoPlanMachineDto,
  ) {
    return this.noPlanMachineService.update(+id, updateNoPlanMachineDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noPlanMachineService.remove(+id);
  }
}
