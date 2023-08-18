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

  async findAll(query: PaginateQuery) {
    const queryBuilder = this.machineRepository.createQueryBuilder('machine');
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

  async findOne(id: number) {
    const machine = await this.machineRepository.findOne({ where: { id: id } });
    if (machine) {
      return machine;
    }
    throw new HttpException('Machine Not Found', HttpStatus.NOT_FOUND);
  }

  async update(id: number, updateMachineDto: UpdateMachineDto) {
    const machine = await this.machineRepository.findOne({ where: { id: id } });
    if (machine) {
      await this.machineRepository.update(id, updateMachineDto);
      const updatedMachine = await this.machineRepository.findOne({
        where: { id: id },
      });
      return updatedMachine;
    }
    throw new HttpException('Machine Not Found', HttpStatus.NOT_FOUND);
  }

  async remove(id: number) {
    const machine = await this.machineRepository.findOne({ where: { id: id } });
    if (machine) {
      await this.machineRepository.delete(id);
      return `${machine.name} deleted`;
    }
    throw new HttpException('Machine Not Found', HttpStatus.NOT_FOUND);
  }

  async findMany(ids: string[]) {
    return this.machineRepository
      .createQueryBuilder('machine')
      .where('machine.id IN(:...ids)', {
        ids: ids,
      })
      .getMany();
  }

  async removeMany(ids: string[]) {
    if (typeof ids === 'string') {
      ids = [`${ids}`];
    }

    const machineIds: Machine[] = await this.findMany(ids);
    await this.machineRepository.remove(machineIds);
    return 'Machine has been Deleted Successfully';
  }
}
