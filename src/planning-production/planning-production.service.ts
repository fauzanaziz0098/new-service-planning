import {
  Inject,
  Injectable,
  forwardRef,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreatePlanningProductionDto } from './dto/create-planning-production.dto';
import { UpdatePlanningProductionDto } from './dto/update-planning-production.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanningProduction } from './entities/planning-production.entity';
import { Repository } from 'typeorm';
import { NoPlanMachineService } from 'src/no-plan-machine/no-plan-machine.service';

@Injectable()
export class PlanningProductionService {
  constructor(
    @InjectRepository(PlanningProduction)
    private readonly planningProductionRepository: Repository<PlanningProduction>,
    @Inject(forwardRef(() => NoPlanMachineService))
    private noPlanMachineService: NoPlanMachineService,
  ) {}

  async create(createPlanningProductionDto: CreatePlanningProductionDto) {
    const isActivePlan = await this.planningProductionRepository.findOne({
      where: { active_plan: true },
      relations: ['shift'],
    });

    // AKTIF
    if (!isActivePlan) {
      const noPlanMachine = await this.noPlanMachineService.findOneByShift(
        createPlanningProductionDto.shift,
      );
      let totalNoPlanMachine = null;
      noPlanMachine.map((res) => {
        totalNoPlanMachine += res.total;
      });
      createPlanningProductionDto.active_plan = true;
      const timeIn = new Date(
        createPlanningProductionDto.date_time_in,
      ).toLocaleTimeString('it-IT');
      const timeOut = new Date(
        createPlanningProductionDto.date_time_out,
      ).toLocaleTimeString('it-IT');
      const differenceTime =
        (await this.convertTime(timeOut)) - (await this.convertTime(timeIn));
      createPlanningProductionDto.total = Math.round(differenceTime / 60) + 1;
      const qty =
        createPlanningProductionDto.qty_planning /
        (differenceTime - totalNoPlanMachine);
      createPlanningProductionDto.qty_per_minute = Math.round(qty);
      createPlanningProductionDto.qty_per_hour = Math.round(qty * 60);
      const planningProduction = await this.planningProductionRepository.save(
        createPlanningProductionDto,
      );
      return planningProduction;

      // MASUK ANTRIAN
    } else {
      try {
        const noPlanMachine = await this.noPlanMachineService.findOneByShift(
          createPlanningProductionDto.shift,
        );
        let totalNoPlanMachine = null;
        noPlanMachine.map((res) => {
          totalNoPlanMachine += res.total;
        });
        createPlanningProductionDto.active_plan = false;
        const timeIn = new Date(
          createPlanningProductionDto.date_time_in,
        ).toLocaleTimeString('it-IT');
        const timeOut = new Date(
          createPlanningProductionDto.date_time_out,
        ).toLocaleTimeString('it-IT');
        const differenceTime =
          (await this.convertTime(timeOut)) - (await this.convertTime(timeIn));
        createPlanningProductionDto.total = Math.round(differenceTime / 60) + 1;
        const qty =
          createPlanningProductionDto.qty_planning /
          (differenceTime - totalNoPlanMachine);
        createPlanningProductionDto.qty_per_minute = Math.round(qty);
        createPlanningProductionDto.qty_per_hour = Math.round(qty * 60);
        const planningProduction = await this.planningProductionRepository.save(
          createPlanningProductionDto,
        );
        return planningProduction;
      } catch (error) {
        throw new Error(error);
      }
    }
  }

  findAll() {
    return `This action returns all planningProduction`;
  }

  findOne(id: number) {
    return `This action returns a #${id} planningProduction`;
  }

  async convertTime(time: any) {
    const timeSplit = time.split(':');
    const minute = +timeSplit[0] * 60 + +timeSplit[1];
    return minute;
  }
}
