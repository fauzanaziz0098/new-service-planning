import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
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
import axios from 'axios';
import { PublicFunctionService } from 'src/public-function/public-function.service';

@Injectable()
export class MachineService {
  constructor(
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
    @Inject(forwardRef(() => PublicFunctionService))
    private publicFunctionService: PublicFunctionService,
  ) {}
  async create(createMachineDto: CreateMachineDto, user: any) {
    const existMachine = await this.machineRepository.findOne({
      where: {
        name: createMachineDto.name,
        client_id: createMachineDto.client_id,
      },
    });
    if (!existMachine) {
      const machine = this.machineRepository.save(createMachineDto);
      await axios.post(`${process.env.SERVICE_REPORT}/activity`, {
        user: user.email,
        client: user.client ?? null,
        category: 'machine',
        methode: 'post',
        description: `Pembuatan Machine (${createMachineDto.name} - ${createMachineDto.number})`,
      });
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
      const nameFilter = `%${query.filter['name']}%`;
      queryBuilder.andWhere('machine.name ILIKE :name', { name: nameFilter });
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

  async findOne(id: number) {
    const machine = await this.machineRepository.findOne({
      where: { id: id },
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
    user: any,
  ) {
    const machine = await this.machineRepository.findOne({
      where: { id: id, client_id },
    });
    if (machine) {
      await this.machineRepository.update(id, updateMachineDto);
      const updatedMachine = await this.machineRepository.findOne({
        where: { id: id },
      });
      const infoCahngeData = await this.publicFunctionService.compareObjects(
        machine,
        updateMachineDto,
      );
      if (infoCahngeData.length > 0) {
        await axios.post(`${process.env.SERVICE_REPORT}/activity`, {
          user: user.email,
          client: user.client ?? null,
          category: 'machine',
          methode: 'patch',
          description: `Perubahan data pada Machine (${machine.name} - ${machine.number})`,
          items: infoCahngeData,
        });
      }
      return updatedMachine;
    }
    throw new HttpException('Machine Not Found', HttpStatus.NOT_FOUND);
  }

  async remove(id: number, client_id: string, user: any) {
    const machine = await this.machineRepository.findOne({
      where: { id: id, client_id },
    });
    if (machine) {
      await this.machineRepository.delete(id);
      await axios.post(`${process.env.SERVICE_REPORT}/activity`, {
        user: user.email,
        client: user.client ?? null,
        category: 'machine',
        methode: 'delete',
        description: `Menghapus Machine (${machine.name} - ${machine.number})`,
      });
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

  async removeMany(ids: string[], client_id: string, user: any) {
    if (typeof ids === 'string') {
      ids = [`${ids}`];
    }

    const machineIds: Machine[] = await this.findMany(ids, client_id);
    const result = machineIds.map((item) => item.name).join(', ');
    await this.machineRepository.remove(machineIds);
    await axios.post(`${process.env.SERVICE_REPORT}/activity`, {
      user: user.email,
      client: user.client ?? null,
      category: 'machine',
      methode: 'delete',
      description: `Menghapus Machine (${result})`,
    });
    return 'Machine has been Deleted Successfully';
  }
}
