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
import { MachineService } from './machine.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { Paginate, PaginateQuery } from 'nestjs-paginate';

@Controller('machine')
export class MachineController {
  constructor(private readonly machineService: MachineService) {}

  @Post()
  create(@Body(new ValidationPipe()) createMachineDto: CreateMachineDto) {
    return this.machineService.create(createMachineDto);
  }

  @Get()
  findAll(@Paginate() query: PaginateQuery) {
    return this.machineService.findAll(query);
  }

  @Get('all-machines')
  getAll() {
    return this.machineService.getAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.machineService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateMachineDto: UpdateMachineDto,
  ) {
    return this.machineService.update(+id, updateMachineDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.machineService.remove(+id);
  }

  @Post('delete/many')
  async removeMany(@Body('ids') ids: string[]) {
    return this.machineService.removeMany(ids);
  }
}
