import {
  Injectable,
  Inject,
  forwardRef,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreateNoPlanMachineDto } from './dto/create-no-plan-machine.dto';
import { UpdateNoPlanMachineDto } from './dto/update-no-plan-machine.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NoPlanMachine } from './entities/no-plan-machine.entity';
import { Repository } from 'typeorm';
import { ShiftService } from 'src/shift/shift.service';

@Injectable()
export class NoPlanMachineService {
  constructor(
    @InjectRepository(NoPlanMachine)
    private readonly noPlanMachineRepository: Repository<NoPlanMachine>,
    @Inject(forwardRef(() => ShiftService))
    private shiftService: ShiftService,
  ) {}

  async create(createNoPlanMachineDto: CreateNoPlanMachineDto) {
    const shift = await this.shiftService.findOne(
      +createNoPlanMachineDto.shift,
    );
    const existNoPlan = await this.noPlanMachineRepository.findOne({
      where: { id: +createNoPlanMachineDto.shift },
    });
    const timeStart = await this.convertTime(shift.time_start);
    const timeEnd = await this.convertTime(shift.time_end);

    const timeIn = await this.convertTime(createNoPlanMachineDto.time_in);
    const timeOut = await this.convertTime(createNoPlanMachineDto.time_out);

    if (
      timeIn >= timeStart &&
      timeIn <= timeEnd &&
      timeOut >= timeStart &&
      timeOut <= timeEnd
    ) {
      if (timeIn < timeOut) {
        createNoPlanMachineDto.total = +timeOut - +timeIn;
        const noPlanMachine = this.noPlanMachineRepository.save(
          createNoPlanMachineDto,
        );
        return noPlanMachine;
      }
      throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    }
    throw new HttpException('Out Range Shift', HttpStatus.BAD_REQUEST);
  }

  findAll() {
    return `This action returns all noPlanMachine`;
  }

  findOne(id: number) {
    return `This action returns a #${id} noPlanMachine`;
  }

  update(id: number, updateNoPlanMachineDto: UpdateNoPlanMachineDto) {
    return `This action updates a #${id} noPlanMachine`;
  }

  remove(id: number) {
    return `This action removes a #${id} noPlanMachine`;
  }

  async convertTime(time: any) {
    const timeSplit = time.split(':');
    const minute = +timeSplit[0] * 60 + +timeSplit[1];
    return minute;
  }
}
