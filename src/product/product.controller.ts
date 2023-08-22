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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @Body(new ValidationPipe()) createProductDto: CreateProductDto,
    @Req() request: Request,
  ) {
    createProductDto.client_id = request.user['client'];
    return this.productService.create(createProductDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Paginate() query: PaginateQuery, @Req() req: Request) {
    return this.productService.findAll(query, req.user['client']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.productService.findOne(+id, req.user['client']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateProductDto: UpdateProductDto,
    @Req() req: Request,
  ) {
    return this.productService.update(
      +id,
      updateProductDto,
      req.user['client'],
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.productService.remove(+id, req.user['client']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('delete/many')
  async removeMany(@Body('ids') ids: string[], @Req() req: Request) {
    return await this.productService.removeMany(ids, req.user['client']);
  }
}
