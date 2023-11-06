import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { CreatePresenceDto } from './dto/create-presence.dto';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Paginate, PaginateQuery } from 'nestjs-paginate';

@Controller('presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('check-in')
  checkIn(@Body() createPresenceDto: CreatePresenceDto, @Req() req: Request) {
    return this.presenceService.checkIn(createPresenceDto, req.user['client']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('check-in')
  checkOut(@Body() updatePresenceDto: UpdatePresenceDto, @Req() req: Request) {
    return this.presenceService.checkOut(updatePresenceDto, req.user['client']);
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Paginate() query: PaginateQuery, @Req() req: Request) {
    return this.presenceService.findAll(query, req.user['client']);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.presenceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePresenceDto: UpdatePresenceDto) {
    return this.presenceService.update(+id, updatePresenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.presenceService.remove(+id);
  }
}
