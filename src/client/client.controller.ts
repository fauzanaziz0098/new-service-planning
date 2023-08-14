import {
  Body,
  Controller,
  Get,
  Query,
  Req,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { CreateClientDto } from './dto/create-client.dto';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('client')
@UseGuards(AuthGuard('jwt'))
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  async findAll(
    @Query('isExport') isExport: boolean,
    @Req() req: Request,
    @Paginate() query: PaginateQuery,
  ) {
    console.log(req.user);

    return await this.clientService.findAll(query);
  }

  @Post()
  async create(@Body() createClientDto: CreateClientDto, @Req() req: Request) {
    return await this.clientService.create(createClientDto);
  }
}
