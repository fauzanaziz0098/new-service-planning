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
import { MachineService } from './machine.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PermissionsGuard } from 'src/auth/guards/permission.guard';

@Controller('machine')
export class MachineController {
  constructor(private readonly machineService: MachineService) {}

  @UseGuards(AuthGuard('jwt'))
  @UseGuards(PermissionsGuard)
  @SetMetadata('permissions', ['CREATE:MACHINE'])
  @Post()
  create(
    @Body(new ValidationPipe()) createMachineDto: CreateMachineDto,
    @Req() request: Request,
  ) {
    createMachineDto.client_id = request.user['client'];
    return this.machineService.create(createMachineDto, request.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @UseGuards(PermissionsGuard)
  @SetMetadata('permissions', ['READ:MACHINE'])
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
    return this.machineService.findOne(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @UseGuards(PermissionsGuard)
  @SetMetadata('permissions', ['UPDATE:MACHINE'])
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
      req.user,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @UseGuards(PermissionsGuard)
  @SetMetadata('permissions', ['DELETE:MACHINE'])
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.machineService.remove(+id, req.user['client'], req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @UseGuards(PermissionsGuard)
  @SetMetadata('permissions', ['DELETE:MACHINE'])
  @Post('delete/many')
  async removeMany(@Body('ids') ids: string[], @Req() req: Request) {
    return this.machineService.removeMany(ids, req.user['client'], req.user);
  }
}
