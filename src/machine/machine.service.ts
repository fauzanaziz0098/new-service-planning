import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Machine } from './entities/machine.entity';
import { Repository } from 'typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  paginate,
} from 'nestjs-paginate';

@Injectable()
export class MachineService {
  constructor(
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
  ) {}
  async create(createMachineDto: CreateMachineDto) {
    const existMachine = await this.machineRepository.findOne({
      where: { name: createMachineDto.name },
    });
    if (!existMachine) {
      const machine = this.machineRepository.save(createMachineDto);
      return machine;
    }
    throw new HttpException(
      'Name Machine Already Available',
      HttpStatus.BAD_REQUEST,
    );
  }

  async findAll(query: PaginateQuery, client_id: string) {
    const queryBuilder = this.machineRepository
      .createQueryBuilder('machine')
      .where('machine.client_id = :client_id', { client_id: client_id });
    var filterableColumns = {};
    if (query.filter?.['name']) {
      filterableColumns['name'] = [FilterOperator.EQ];
    }

    const config: PaginateConfig<Machine> = {
      sortableColumns: ['id'],
      searchableColumns: ['name'],
      filterableColumns,
    };

    return paginate<Machine>(query, queryBuilder, config);
    // const allMachine = this.machineRepository.find();
    // return allMachine;
  }

  async getAll(client_id: string) {
    const allMachine = this.machineRepository.find({ where: { client_id } });
    return allMachine;
  }

  async findOne(id: number, client_id: string) {
    const machine = await this.machineRepository.findOne({
      where: { id: id, client_id },
    });
    if (machine) {
      return machine;
    }
    throw new HttpException('Machine Not Found', HttpStatus.NOT_FOUND);
  }

  async update(
    id: number,
    updateMachineDto: UpdateMachineDto,
    client_id: string,
  ) {
    const machine = await this.machineRepository.findOne({
      where: { id: id, client_id },
    });
    if (machine) {
      await this.machineRepository.update(id, updateMachineDto);
      const updatedMachine = await this.machineRepository.findOne({
        where: { id: id },
      });
      return updatedMachine;
    }
    throw new HttpException('Machine Not Found', HttpStatus.NOT_FOUND);
  }

  async remove(id: number, client_id: string) {
    const machine = await this.machineRepository.findOne({
      where: { id: id, client_id },
    });
    if (machine) {
      await this.machineRepository.delete(id);
      return `${machine.name} deleted`;
    }
    throw new HttpException('Machine Not Found', HttpStatus.NOT_FOUND);
  }

  async findMany(ids: string[], client_id: string) {
    return this.machineRepository
      .createQueryBuilder('machine')
      .where('machine.id IN(:...ids)', {
        ids: ids,
      })
      .andWhere('machine.client_id =:client_id', { client_id })
      .getMany();
  }

  async removeMany(ids: string[], client_id: string) {
    if (typeof ids === 'string') {
      ids = [`${ids}`];
    }

    const machineIds: Machine[] = await this.findMany(ids, client_id);
    await this.machineRepository.remove(machineIds);
    return 'Machine has been Deleted Successfully';
  }
}
