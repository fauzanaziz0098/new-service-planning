import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity';
import { Repository } from 'typeorm';
import { PaginateConfig, paginate } from 'nestjs-paginate';

@Injectable()
export class ShiftService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
  ) {}

  async create(createShiftDto: CreateShiftDto) {
    const existShift = await this.shiftRepository.findOne({
      where: { name: createShiftDto.name, client_id: createShiftDto.client_id },
    });
    if (!existShift) {
      const shift = this.shiftRepository.save(createShiftDto);
      return shift;
    }
    throw new HttpException(
      'Name Shift Already Available',
      HttpStatus.BAD_REQUEST,
    );
  }

  findAll(query, client_id: string) {
    // return this.shiftRepository.find({ where: { client_id: client_id }, order: {id: 'ASC'} });
    const queryBuilder = this.shiftRepository
    .createQueryBuilder('shift')
    .where('shift.client_id =:client_id', { client_id });
  var filterableColumns = {};
  if (query.filter?.['name']) {
    const nameFilter = `%${query.filter['name']}%`;
    queryBuilder.andWhere('shift.name ILIKE :name', { name: nameFilter });
  }


  const config: PaginateConfig<Shift> = {
    sortableColumns: ['id'],
    searchableColumns: ['name'],
    filterableColumns,
  };

  return paginate<Shift>(query, queryBuilder, config);
  }

  async findAllWithoutFilterClient() {
    return await this.shiftRepository.find({
      relations: ['no_plan_machine_id'],
    });
  }

  async findOne(id: number) {
    const shift = await this.shiftRepository.findOne({ where: { id: id } });
    if (shift) {
      return shift;
    }
    throw new HttpException('Shift Not Found', HttpStatus.NOT_FOUND);
  }

  async update(id: number, updateShiftDto: UpdateShiftDto) {
    const shift = await this.shiftRepository.findOne({ where: { id: id } });
    if (shift) {
      await this.shiftRepository.update(id, updateShiftDto);
      const updatedShift = this.shiftRepository.findOneBy({ id });
      return updatedShift;
    }
    throw new HttpException('Shift Not Found', HttpStatus.NOT_FOUND);
  }

  async remove(id: number) {
    const shift = await this.shiftRepository.findOne({ where: { id: id } });
    if (shift) {
      await this.shiftRepository.delete(id);
      return `${shift.name} deleted`;
    }
    throw new HttpException('Shift Not Found', HttpStatus.NOT_FOUND);
  }

  async getShiftBatewinByTimeStart(clientId: string, startTime: string) {
    return await this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.no_plan_machine_id', 'no_plan_machine_id')
      .where(':startTime BETWEEN shift.time_start AND shift.time_end', {
        startTime,
      })
      .andWhere('shift.client_id = :clientId', { clientId })
      .getOne();
  }
  async getShiftBatewinByTimeEnd(clientId: string, endTime: string) {
    return await this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.no_plan_machine_id', 'no_plan_machine_id')
      .where(':endTime BETWEEN shift.time_start AND shift.time_end', {
        endTime,
      })
      .andWhere('shift.client_id = :clientId', { clientId })
      .getOne();
  }
}
