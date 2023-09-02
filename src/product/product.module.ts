import { Module, forwardRef } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicFunctionModule } from 'src/public-function/public-function.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    forwardRef(() => PublicFunctionModule),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
