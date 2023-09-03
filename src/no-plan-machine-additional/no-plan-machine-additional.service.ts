import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateNoPlanMachineAdditionalDto } from './dto/create-no-plan-machine-additional.dto';
import { UpdateNoPlanMachineAdditionalDto } from './dto/update-no-plan-machine-additional.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NoPlanMachineAdditional } from './entities/no-plan-machine-additional.entity';
import { Repository } from 'typeorm';
import { NoPlanMachine } from 'src/no-plan-machine/entities/no-plan-machine.entity';
import * as moment from 'moment';
import { PlanningProductionService } from 'src/planning-production/planning-production.service';

@Injectable()
export class NoPlanMachineAdditionalService {
  constructor(
    @InjectRepository(NoPlanMachineAdditional)
    private readonly noPlanMachineAdditionalRepository: Repository<NoPlanMachineAdditional>,
    @InjectRepository(NoPlanMachine)
    private readonly noPlanMachineRepository: Repository<NoPlanMachine>,
    @Inject(forwardRef(() => PlanningProductionService))
    private planningProductionService: PlanningProductionService,
  ) {}

  async create(
    createNoPlanMachineAdditionalDto: CreateNoPlanMachineAdditionalDto,
  ) {
    const today = moment().format('dddd').toLocaleLowerCase();
    const planningProductionActive =
      await this.planningProductionService.getPlanningProduction(
        createNoPlanMachineAdditionalDto.client_id,
      );
    const noPlanMachineToday = await this.noPlanMachineRepository
      .createQueryBuilder('noPlanMachine')
      .where('day =:today', { today })
      .andWhere('client_id =:client_id', {
        client_id: createNoPlanMachineAdditionalDto.client_id,
      })
      .getMany();

    if (!planningProductionActive) {
      throw new HttpException('No Planning Active', HttpStatus.BAD_REQUEST);
    }

    if (noPlanMachineToday.length > 0) {
      noPlanMachineToday.map((item) => {
        const timeInNoPlan = moment(item.time_in, 'HH:mm:ss');
        const timeOutNoPlan = moment(item.time_out, 'HH:mm:ss');
        const timeInCreate = moment(
          createNoPlanMachineAdditionalDto.time_in,
          'HH:mm:ss',
        );
        const timeOutCreate = moment(
          createNoPlanMachineAdditionalDto.time_out,
          'HH:mm:ss',
        );

        if (
          (timeInCreate.isSameOrAfter(timeInNoPlan) &&
            timeInCreate.isSameOrBefore(timeOutNoPlan)) ||
          (timeOutCreate.isSameOrAfter(timeInNoPlan) &&
            timeOutCreate.isSameOrBefore(timeOutNoPlan))
        ) {
          throw new HttpException(
            'The entered time is between the no plan times',
            HttpStatus.NOT_FOUND,
          );
        }
      });
    }

    return this.noPlanMachineAdditionalRepository.save(
      createNoPlanMachineAdditionalDto,
    );
  }

  findAll(client_id: string) {
    return `This action returns all noPlanMachineAdditional`;
  }

  findOne(id: number) {
    return `This action returns a #${id} noPlanMachineAdditional`;
  }

  update(
    id: number,
    updateNoPlanMachineAdditionalDto: UpdateNoPlanMachineAdditionalDto,
  ) {
    return `This action updates a #${id} noPlanMachineAdditional`;
  }

  remove(id: number) {
    return `This action removes a #${id} noPlanMachineAdditional`;
  }
}
