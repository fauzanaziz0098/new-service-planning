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
  SetMetadata,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from 'src/auth/guards/permission.guard';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(AuthGuard('jwt'))
  // @UseGuards(PermissionsGuard)
  // @SetMetadata('permissions', ['CREATE:PRODUCT'])
  @Post()
  create(
    @Body(new ValidationPipe()) createProductDto: CreateProductDto,
    @Req() request: Request,
  ) {
    createProductDto.client_id = request.user['client'];
    return this.productService.create(createProductDto);
  }

  @UseGuards(AuthGuard('jwt'))
  // @UseGuards(PermissionsGuard)
  // @SetMetadata('permissions', ['VIEW:PRODUCT'])
  @Get()
  findAll(@Paginate() query: PaginateQuery, @Req() req: Request) {
    return this.productService.findAll(query, req.user['client']);
  }

  @UseGuards(AuthGuard('jwt'))
  // @UseGuards(PermissionsGuard)
  // @SetMetadata('permissions', ['SHOW:PRODUCT'])
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.productService.findOne(+id, req.user['client']);
  }

  @UseGuards(AuthGuard('jwt'))
  // @UseGuards(PermissionsGuard)
  // @SetMetadata('permissions', ['UPDATE:PRODUCT'])
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
  // @UseGuards(PermissionsGuard)
  // @SetMetadata('permissions', ['DELETE:PRODUCT'])
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.productService.remove(+id, req.user['client']);
  }

  @UseGuards(AuthGuard('jwt'))
  // @UseGuards(PermissionsGuard)
  // @SetMetadata('permissions', ['DELETE:PRODUCT'])
  @Post('delete/many')
  async removeMany(@Body('ids') ids: string[], @Req() req: Request) {
    return await this.productService.removeMany(ids, req.user['client']);
  }
}
