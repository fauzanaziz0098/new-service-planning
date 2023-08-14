import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ShiftService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
  ) {}

  async create(createShiftDto: CreateShiftDto) {
    const existShift = await this.shiftRepository.findOne({
      where: { name: createShiftDto.name },
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

  findAll() {
    return this.shiftRepository.find();
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
}
