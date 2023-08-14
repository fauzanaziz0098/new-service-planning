import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Repository } from 'typeorm';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async findAll(query: PaginateQuery) {
    return paginate(query, this.clientRepository, {
      sortableColumns: ['id'],
      searchableColumns: ['name'],
    });
  }

  async create(createClientDto: CreateClientDto) {
    try {
      const client = this.clientRepository.create(createClientDto);
      await this.clientRepository.save(client);
      return 'Client created successfully';
    } catch (error) {
      throw new BadRequestException('Client failed to create');
    }
  }
}
