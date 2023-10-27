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
import * as moment from 'moment';
import { PlanningProductionService } from 'src/planning-production/planning-production.service';

@Injectable()
export class NoPlanMachineService {
  constructor(
    @InjectRepository(NoPlanMachine)
    private readonly noPlanMachineRepository: Repository<NoPlanMachine>,
    @Inject(forwardRef(() => ShiftService))
    private shiftService: ShiftService,
    @Inject(forwardRef(() => PlanningProductionService))
    private planningProductionService: PlanningProductionService,
  ) {}

  async create(createNoPlanMachineDto: CreateNoPlanMachineDto) {
    const shift = await this.shiftService.findOne(
      +createNoPlanMachineDto.shift,
    );

    const activePlan = await this.planningProductionService.getPlanningProduction(createNoPlanMachineDto.client_id)

    if (activePlan?.shift?.id == shift.id) {
      throw new HttpException("Cannot create no plan if shift still used", HttpStatus.BAD_REQUEST);
    }

    const timeStart = await this.convertTime(shift.time_start);
    const timeEnd = await this.convertTime(shift.time_end);

    const timeIn = (moment(createNoPlanMachineDto.time_in).hour() * 60) + moment(createNoPlanMachineDto.time_in).minute();
    const timeOut = (moment(createNoPlanMachineDto.time_out).hour() * 60) + moment(createNoPlanMachineDto.time_out).minute();

    const noPlanInDayExist = await this.noPlanMachineRepository.find({
      where: {
        day: createNoPlanMachineDto.day,
        client_id: createNoPlanMachineDto.client_id,
      },
      relations: ['shift'],
    });

    noPlanInDayExist.forEach((item) => {
      const timeInCreate = moment(createNoPlanMachineDto.time_in, 'HH:mm:ss');
      const timeOutCreate = moment(createNoPlanMachineDto.time_out, 'HH:mm:ss');

      const timeInItem = moment(item.time_in, 'HH:mm:ss');
      const timeOutItem = moment(item.time_out, 'HH:mm:ss');

      if (
        createNoPlanMachineDto.day === item.day &&
        +createNoPlanMachineDto.shift == item.shift.id
      ) {
        if (
          (timeInCreate.isSameOrBefore(timeOutItem) &&
            timeInCreate.isSameOrAfter(timeInItem)) ||
          (timeOutCreate.isSameOrAfter(timeInItem) &&
            timeOutCreate.isSameOrBefore(timeOutItem))
        ) {
          throw new HttpException(
            'The entered time is between the no plan times on the same day',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    });
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
      throw new HttpException(
        'Time In Greater Than Time Out',
        HttpStatus.BAD_REQUEST,
      );
    }
    throw new HttpException('Out Range Shift', HttpStatus.BAD_REQUEST);
  }

  findAll(client_id: string) {
    return this.noPlanMachineRepository.find({
      where: { client_id: client_id },
      relations: ['shift'],
    });
  }

  async findOne(id: number) {
    const noPlanMachine = await this.noPlanMachineRepository.findOne({
      where: { id: id },
      relations: ['shift'],
    });
    if (noPlanMachine) {
      return noPlanMachine;
    }
    throw new HttpException('No Plan Machine Not Found', HttpStatus.NOT_FOUND);
  }

  async update(id: number, updateNoPlanMachineDto: UpdateNoPlanMachineDto) {
    const noPlanMachine = await this.noPlanMachineRepository.findOne({
      where: { id: id },
      relations: ['shift'],
    });
    const shift = await this.shiftService.findOne(
      +updateNoPlanMachineDto.shift
        ? +updateNoPlanMachineDto.shift
        : +noPlanMachine.shift.id,
    );

    // cek aktif plan dengan client_id
    const today = moment().format('dddd').toLocaleLowerCase();
    const activePlan =
      await this.planningProductionService.getPlanningProduction(
        updateNoPlanMachineDto.client_id,
      );
    if (activePlan && (activePlan.shift.id == noPlanMachine.shift.id && today == noPlanMachine.day)
    ) {
      throw new HttpException(
        'No plan machine is using, cannot update',
        HttpStatus.FORBIDDEN,
      );
    }

    const timeStart = await this.convertTime(shift.time_start);
    const timeEnd = await this.convertTime(shift.time_end);

    // const timeIn = await this.convertTime(
    //   updateNoPlanMachineDto.time_in
    //     ? updateNoPlanMachineDto.time_in
    //     : noPlanMachine.time_in,
    // );
    // const timeOut = await this.convertTime(
    //   updateNoPlanMachineDto.time_out
    //     ? updateNoPlanMachineDto.time_out
    //     : noPlanMachine.time_out,
    // );

    const timeIn = (moment(updateNoPlanMachineDto.time_in ? updateNoPlanMachineDto.time_in : noPlanMachine.time_in).hour() * 60) + moment(updateNoPlanMachineDto.time_in ? updateNoPlanMachineDto.time_in : noPlanMachine.time_in).minute();
    const timeOut = (moment(updateNoPlanMachineDto.time_out ? updateNoPlanMachineDto.time_out : noPlanMachine.time_out).hour() * 60) + moment(updateNoPlanMachineDto.time_out ? updateNoPlanMachineDto.time_out : noPlanMachine.time_out).minute();

    if (
      timeIn >= timeStart &&
      timeIn <= timeEnd &&
      timeOut >= timeStart &&
      timeOut <= timeEnd
    ) {
      if (timeIn < timeOut) {
        updateNoPlanMachineDto.total = +timeOut - +timeIn;
        await this.noPlanMachineRepository.update(id, updateNoPlanMachineDto);
        const noPlanMachine = await this.noPlanMachineRepository.findOne({
          where: { id: id },
          relations: ['shift'],
        });
        return noPlanMachine;
      }
      throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    }
    throw new HttpException('Out Range Shift', HttpStatus.BAD_REQUEST);
  }

  async remove(id: number, clientId) {
    const noPlanMachine = await this.noPlanMachineRepository.findOne({
      where: { id: id },
      relations: ['shift'],
    });
    const activePlan = await this.planningProductionService.getPlanningProduction(clientId);


    if (activePlan && activePlan.shift.id == noPlanMachine.shift.id) {
      throw new HttpException("Cannot delete no plan when shift used", HttpStatus.BAD_REQUEST);
    }

    if (noPlanMachine) {
      await this.noPlanMachineRepository.delete(id);
      return 'No Plan Machine Deleted';
    }
    throw new HttpException('No Plan Machine Not Found', HttpStatus.NOT_FOUND);
  }

  async convertTime(time: any) {
    const timeSplit = time.split(':');
    const minute = +timeSplit[0] * 60 + +timeSplit[1];
    return minute;
  }

  async findOneByShift(shiftId: any, day: string) {
    const noPlanMachine = await this.noPlanMachineRepository
      .createQueryBuilder('no_plan_machine')
      .leftJoinAndSelect('no_plan_machine.shift', 'shift')
      .where('shift.id = :id', {
        id: shiftId,
      })
      .andWhere('day = :day', {
        day: day,
      })
      .getMany();
    if (noPlanMachine.length > 0) {
      return noPlanMachine;
    }
    return [];
  }

  async findAllByShift(shiftId: string) {
    const noPlanMachine = await this.noPlanMachineRepository
      .createQueryBuilder('no_plan_machine')
      .leftJoinAndSelect('no_plan_machine.shift', 'shift')
      .where('shift.id = :id', {
        id: shiftId,
      })
      .getMany();

    return noPlanMachine;
  }
}
