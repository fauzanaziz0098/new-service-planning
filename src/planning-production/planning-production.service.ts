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
import { IsNull, MoreThan, Not, Repository } from 'typeorm';
import { NoPlanMachineService } from 'src/no-plan-machine/no-plan-machine.service';
import * as mqtt from 'mqtt';
import { VariablePlanningProduction } from 'src/interface/variable-loss-time.interface';
import { ShiftService } from 'src/shift/shift.service';

@Injectable()
export class PlanningProductionService {
  private client: mqtt.MqttClient;
  constructor(
    @InjectRepository(PlanningProduction)
    private readonly planningProductionRepository: Repository<PlanningProduction>,
    @Inject(forwardRef(() => NoPlanMachineService))
    private noPlanMachineService: NoPlanMachineService,
    @Inject(forwardRef(() => ShiftService))
    private shiftService: ShiftService,
  ) {
    this.initializeMqttClient();
  }

  private initializeMqttClient() {
    const connectUrl = process.env.MQTT_CONNECTION;

    this.client = mqtt.connect(connectUrl, {
      clientId: `mqtt_nest_${Math.random().toString(16).slice(3)}`,
      clean: true,
      connectTimeout: 4000,
      username: '',
      password: '',
      reconnectPeriod: 1000,
    });

    this.client.on('connect', () => {
      console.log('MQTT client connected');
    });

    this.subscribeToTopic();

    this.client.on('message', (topic, message) => {
      if (message) {
        // this.publish();
        this.publishMessage(topic, JSON.parse(message.toString()));
      }
    });

    this.client.on('error', (error) => {
      console.log('Connection failed:', error);
    });
  }

  private subscribeToTopic() {
    const machineId = [1];
    machineId.map((id) => {
      this.client.subscribe(`MC${id}:STOP:RPA`, { qos: 2 }, (err) => {
        if (err) {
          console.log(`Error subscribe topic : MC${id}:PLAN:RPA`, err);
        }
      });
    });
  }

  private async publishMessage(
    topic: string,
    message: VariablePlanningProduction,
  ) {
    const activePlanProduction =
      await this.planningProductionRepository.findOne({
        where: { active_plan: true },
        relations: ['shift'],
      });
    const topicSplit = topic.split(':')[0];
    delete message.qty_actual;
    delete message.qty_hour;
    message.OperatorId = [1];
    message.ShiftName = [activePlanProduction?.shift?.name ?? ''];
    const sendVariable = JSON.stringify(message);
    if (activePlanProduction) {
      this.client.publish(
        `${topicSplit}:PLAN:RPA`,
        sendVariable,
        { qos: 2, retain: true },
        (error) => {
          if (error) {
            console.error('Error publishing message:', error);
          }
        },
      );
    }
  }

  // CREATE PLANNING PRODUCTION
  async createPlanningProduction(
    createPlanningProductionDto: CreatePlanningProductionDto,
  ) {
    const isActivePlan = await this.planningProductionRepository.findOne({
      where: { active_plan: true },
      relations: ['shift'],
    });
    const waitDandory = await this.planningProductionRepository.findOne({
      where: { dandory_time: Not(IsNull()) },
    });
    const shift = await this.shiftService.findOne(
      +createPlanningProductionDto.shift,
    );
    if (!shift) {
      throw new HttpException('Shift Not Found', HttpStatus.NOT_FOUND);
    }
    const shiftStart = await this.convertTime(shift.time_start);
    const shiftEnd = await this.convertTime(shift.time_end);

    // AKTIF
    if (!isActivePlan && !waitDandory) {
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
      if (
        (await this.convertTime(timeIn)) >= shiftStart &&
        (await this.convertTime(timeOut)) <= shiftEnd
      ) {
        const differenceTime =
          (await this.convertTime(timeOut)) - (await this.convertTime(timeIn));
        createPlanningProductionDto.total = Math.round(differenceTime / 60) + 1;
        const qty =
          createPlanningProductionDto.qty_planning /
          (differenceTime - totalNoPlanMachine);
        createPlanningProductionDto.qty_per_minute = Math.round(qty);
        createPlanningProductionDto.qty_per_hour = Math.round(qty * 60);
        // createPlanningProductionDto.qty_per_hour = Math.round( //Note: Format mtm qty_per_hour
        //   createPlanningProductionDto.qty_planning / (differenceTime / 60),
        // );
        createPlanningProductionDto.dandory_time = null;
        const planningProduction = await this.planningProductionRepository.save(
          createPlanningProductionDto,
        );
        return planningProduction;
      }
      return new HttpException('Out Of Shift', HttpStatus.BAD_REQUEST);

      // MASUK ANTRIAN
    } else {
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
      if (
        (await this.convertTime(timeIn)) >= shiftStart &&
        (await this.convertTime(timeOut)) <= shiftEnd
      ) {
        const differenceTime =
          (await this.convertTime(timeOut)) - (await this.convertTime(timeIn));
        createPlanningProductionDto.total = Math.round(differenceTime / 60) + 1;
        const qty =
          createPlanningProductionDto.qty_planning /
          (differenceTime - totalNoPlanMachine);
        createPlanningProductionDto.qty_per_minute = Math.round(qty);
        createPlanningProductionDto.qty_per_hour = Math.round(qty * 60);
        createPlanningProductionDto.dandory_time =
          createPlanningProductionDto.dandory_time
            ? createPlanningProductionDto.dandory_time
            : 0;
        const planningProduction = await this.planningProductionRepository.save(
          createPlanningProductionDto,
        );
        return planningProduction;
      }
      return new HttpException('Out Of Shift', HttpStatus.BAD_REQUEST);
    }
  }

  async stopPlanningProduction() {
    const activePlan = await this.planningProductionRepository.findOne({
      where: { active_plan: true },
      relations: ['shift'],
    });

    if (!activePlan) {
      return 'No Active Plan';
    }
    const nextPlan = await this.planningProductionRepository.findOne({
      where: { id: MoreThan(activePlan.id) },
      order: { id: 'asc' },
    });
    if (nextPlan) {
      if (nextPlan.dandory_time != 0) {
        await this.planningProductionRepository.update(activePlan.id, {
          active_plan: false,
        });
        setTimeout(async () => {
          await this.planningProductionRepository.update(nextPlan.id, {
            active_plan: true,
            dandory_time: null,
          });
          const newNextPlan = this.planningProductionRepository.findOne({
            where: { id: nextPlan.id },
          });
          return newNextPlan;
        }, 6000 * nextPlan.dandory_time);
        return `Waiting Dandory Time To Activate Next Plan, Least ${nextPlan.dandory_time} minute`;
      } else {
        await this.planningProductionRepository.update(activePlan.id, {
          active_plan: false,
        });
        await this.planningProductionRepository.update(nextPlan.id, {
          active_plan: true,
        });
        const newNextPlan = this.planningProductionRepository.findOne({
          where: { id: nextPlan.id },
        });
        return newNextPlan;
      }
    }
    await this.planningProductionRepository.update(activePlan.id, {
      active_plan: false,
    });
    // return 'All Plan In Queue Has Been Finished';
    return 'No Plan In Queue, No Active Plan';
  }

  async getPlanningProduction() {
    const activePlanProduction =
      await this.planningProductionRepository.findOne({
        where: { active_plan: true },
        relations: ['shift', 'product', 'machine'],
      });
    if (activePlanProduction) {
      return activePlanProduction;
    }
    throw new HttpException('No Active Plan', HttpStatus.NOT_FOUND);
  }

  async convertTime(time: any) {
    const timeSplit = time.split(':');
    const minute = +timeSplit[0] * 60 + +timeSplit[1];
    return minute;
  }
}
