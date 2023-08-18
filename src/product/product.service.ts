import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  paginate,
} from 'nestjs-paginate';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const existPartName = await this.productRepository.findOne({
      where: {
        part_name: createProductDto.part_name,
      },
    });
    if (!existPartName) {
      const product = this.productRepository.save(createProductDto);
      return product;
    }
    throw new HttpException(
      'Part Name Already Available',
      HttpStatus.BAD_REQUEST,
    );
  }

  async findAll(query: PaginateQuery) {
    const queryBuilder = this.productRepository.createQueryBuilder('product');
    var filterableColumns = {};
    if (query.filter?.['part_name']) {
      filterableColumns['part_name'] = [FilterOperator.EQ];
    }

    const config: PaginateConfig<Product> = {
      sortableColumns: ['id'],
      searchableColumns: ['part_name'],
      filterableColumns,
    };

    return paginate<Product>(query, queryBuilder, config);
    // const allProduct = this.productRepository.find();
    // return allProduct;
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOneBy({ id });
    if (product) {
      return product;
    }
    throw new HttpException('Product Not Found', HttpStatus.NOT_FOUND);
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.findOneBy({ id });
    if (product) {
      await this.productRepository.update(+id, updateProductDto);
      const updatedProduct = await this.productRepository.findOneBy({ id });
      return updatedProduct;
    }
    throw new HttpException('Product Not Found', HttpStatus.NOT_FOUND);
  }

  async remove(id: number) {
    const product = await this.productRepository.findOneBy({ id });
    if (product) {
      await this.productRepository.delete(id);
      return `${product.part_name} deleted`;
    }
    throw new HttpException('Product Not Found', HttpStatus.NOT_FOUND);
  }

  async findMany(ids: string[]) {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.id IN(:...ids)', {
        ids: ids,
      })
      .getMany();
  }
  async removeMany(ids: string[]) {
    if (typeof ids === 'string') {
      ids = [`${ids}`];
    }

    const productIds: Product[] = await this.findMany(ids);
    await this.productRepository.remove(productIds);
    return 'Product has been Deleted Successfully';
  }
}
