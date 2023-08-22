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
        client_id: createProductDto.client_id,
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

  async findAll(query: PaginateQuery, client_id: string) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .where('product.client_id =:client_id', { client_id });
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

  async findOne(id: number, client_id: string) {
    const product = await this.productRepository.findOneBy({ id, client_id });
    if (product) {
      return product;
    }
    throw new HttpException('Product Not Found', HttpStatus.NOT_FOUND);
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    client_id: string,
  ) {
    const product = await this.productRepository.findOneBy({ id, client_id });
    if (product) {
      await this.productRepository.update(+id, updateProductDto);
      const updatedProduct = await this.productRepository.findOneBy({ id });
      return updatedProduct;
    }
    throw new HttpException('Product Not Found', HttpStatus.NOT_FOUND);
  }

  async remove(id: number, client_id: string) {
    const product = await this.productRepository.findOneBy({ id, client_id });
    if (product) {
      await this.productRepository.delete(id);
      return `${product.part_name} deleted`;
    }
    throw new HttpException('Product Not Found', HttpStatus.NOT_FOUND);
  }

  async findMany(ids: string[], client_id: string) {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.id IN(:...ids)', {
        ids: ids,
      })
      .andWhere('product.client_id =:client_id', { client_id })
      .getMany();
  }
  async removeMany(ids: string[], client_id: string) {
    if (typeof ids === 'string') {
      ids = [`${ids}`];
    }

    const productIds: Product[] = await this.findMany(ids, client_id);
    await this.productRepository.remove(productIds);
    return 'Product has been Deleted Successfully';
  }
}
