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
import { MachineService } from 'src/machine/machine.service';
import { ProductService } from 'src/product/product.service';
import * as moment from 'moment';

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
    @Inject(forwardRef(() => MachineService))
    private machineService: MachineService,
    @Inject(forwardRef(() => ProductService))
    private productService: ProductService,
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
    console.log(message);

    message.OperatorId = [activePlanProduction?.user];
    message.ShiftName = [activePlanProduction?.shift?.name ?? ''];
    message.clientId = [activePlanProduction?.client_id];
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
    const allPlanningProduction =
      await this.planningProductionRepository.find();
    // cek aktif plan
    const isActivePlan = await this.planningProductionRepository.findOne({
      where: {
        active_plan: true,
        client_id: createPlanningProductionDto.client_id,
      },
      relations: ['shift'],
    });
    //cek shift
    const shift = await this.shiftService.findOne(
      +createPlanningProductionDto.shift,
    );
    // cek machine
    const machine = await this.machineService.findOne(
      +createPlanningProductionDto.machine,
    );
    // cek product
    const product = await this.productService.findOne(
      +createPlanningProductionDto.product,
      createPlanningProductionDto.client_id,
    );

    // convert shift jadi menit
    const shiftStart = await this.convertTime(shift.time_start);
    const shiftEnd = await this.convertTime(shift.time_end);

    // convert time in ke menit
    const timeIn = new Date(
      createPlanningProductionDto.date_time_in,
    ).toLocaleTimeString('it-IT');

    // convert time out ke menit
    const timeOut = new Date(
      createPlanningProductionDto.date_time_out,
    ).toLocaleTimeString('it-IT');

    // validasi time
    if (timeIn > timeOut) {
      return 'Time In Greater Than Time Out';
    }
    const validateTimeIn = allPlanningProduction.map((plan) => {
      const newPlanDateIn = new Date(
        createPlanningProductionDto.date_time_in,
      ).getTime();
      const planDateIn = new Date(plan.date_time_in).getTime();
      return newPlanDateIn >= planDateIn;
    });
    const validateTimeOut = allPlanningProduction.map((plan) => {
      const newPlanDateOut = new Date(
        createPlanningProductionDto.date_time_out,
      ).getTime();
      const planDateout = new Date(plan.date_time_out).getTime();
      return newPlanDateOut >= planDateout;
    });
    if (validateTimeIn.includes(true)) {
      return 'Time In Already Used By Other Plan';
    }
    if (validateTimeOut.includes(true)) {
      return 'Time Out Already Used By Other Plan';
    }

    // jika tidak ada plan yang aktif dan tidak ada dandory time, AKTIF
    if (!isActivePlan) {
      createPlanningProductionDto.active_plan = true;
      createPlanningProductionDto.date_time_in = moment().toDate();
      createPlanningProductionDto.total_time_planning = Math.round(
        (product.cycle_time * createPlanningProductionDto.qty_planning) / 60,
      );

      createPlanningProductionDto.dandory_time = null;
      const planningProduction = await this.planningProductionRepository.save(
        createPlanningProductionDto,
      );
      return planningProduction;

      // Jika ada dandory time dan plan aktif,MASUK ANTRIAN
    } else {
      createPlanningProductionDto.active_plan = false;
      createPlanningProductionDto.total_time_planning = Math.round(
        (product.cycle_time * createPlanningProductionDto.qty_planning) / 60,
      );
      const planningProduction = await this.planningProductionRepository.save(
        createPlanningProductionDto,
      );
      return planningProduction;
    }
  }

  async stopPlanningProduction(client_id: string) {
    // cek aktif plan
    const activePlan = await this.planningProductionRepository.findOne({
      where: { active_plan: true, client_id: client_id },
      relations: ['shift'],
    });

    if (!activePlan) {
      return 'No Active Plan';
    }

    // cek plan berikutnya yang akan aktif
    const nextPlan = await this.planningProductionRepository.findOne({
      where: { id: MoreThan(activePlan.id), client_id },
      order: { id: 'asc' },
      relations: ['product', 'machine'],
    });

    const today = moment().format('dddd').toLocaleLowerCase();
    const noPlanMachine = await this.noPlanMachineService.findOneByShift(
      activePlan.shift.id,
      today,
    );
    let totalNoPlanMachine = null;
    noPlanMachine.map((res) => {
      totalNoPlanMachine += res.total;
    });

    console.log(totalNoPlanMachine);

    // convert time in ke menit
    const timeIn = new Date(activePlan.date_time_in).toLocaleTimeString(
      'it-IT',
    );

    // convert time out ke menit
    const activePlanDateTimeOut = moment().toDate();
    const timeOut = new Date(activePlanDateTimeOut).toLocaleTimeString('it-IT');
    // selisih waktu masuk dan keluar dalam menit
    const differenceTime =
      (await this.convertTime(timeOut)) - (await this.convertTime(timeIn));

    const qty = activePlan.qty_planning / (differenceTime - totalNoPlanMachine);

    if (nextPlan) {
      const machine = await this.machineService.findOne(+nextPlan.machine.id);
      const product = await this.productService.findOne(
        +nextPlan.product.id,
        nextPlan.client_id,
      );
      if (nextPlan.dandory_time != 0) {
        await this.planningProductionRepository.update(activePlan.id, {
          // active_plan: false,
          dandory_time: -1,
          date_time_out: activePlanDateTimeOut,
          total_time_actual: differenceTime,
          qty_per_minute: parseFloat(qty.toFixed(2)),
          qty_per_hour: Math.round(qty * 60),
        });
        setTimeout(async () => {
          await this.planningProductionRepository.update(nextPlan.id, {
            active_plan: true,
            dandory_time: null,
            date_time_in: moment().toDate(),
          });
          await this.planningProductionRepository.update(activePlan.id, {
            active_plan: false,
            dandory_time: null,
          });
          const newNextPlan = this.planningProductionRepository.findOne({
            where: { id: nextPlan.id, client_id: client_id },
          });

          return newNextPlan;
        }, 60000 * nextPlan.dandory_time);
        if (nextPlan.dandory_time != null) {
          return `Waiting Dandory Time To Activate Next Plan, Least ${nextPlan.dandory_time} minute`;
        }
        return `Plan has been Stopped, Activate Next Plan`;
      } else {
        await this.planningProductionRepository.update(activePlan.id, {
          active_plan: false,
          date_time_out: activePlanDateTimeOut,
          total_time_actual: differenceTime,
          qty_per_minute: parseFloat(qty.toFixed(2)),
          qty_per_hour: Math.round(qty * 60),
        });
        await this.planningProductionRepository.update(nextPlan.id, {
          active_plan: true,
          date_time_in: moment().toDate(),
        });
        const newNextPlan = this.planningProductionRepository.findOne({
          where: { id: nextPlan.id, client_id },
        });
        return `Plan has been Stopped, Activate Next Plan`;
      }
    }
    await this.planningProductionRepository.update(activePlan.id, {
      active_plan: false,
      date_time_out: activePlanDateTimeOut,
      total_time_actual: differenceTime,
      qty_per_minute: parseFloat(qty.toFixed(2)),
      qty_per_hour: Math.round(qty * 60),
    });
    // return 'All Plan In Queue Has Been Finished';
    return 'No Plan In Queue, No Active Plan';
  }

  async getPlanningProduction(client_id: string) {
    const activePlanProduction =
      await this.planningProductionRepository.findOne({
        where: { active_plan: true, client_id: client_id },
        relations: ['shift', 'product', 'machine'],
      });
    if (activePlanProduction) {
      // jika dandory time plan active negative, berarti sedang menunggu dandory time dari plan berikutnya untuk aktif
      if (activePlanProduction.dandory_time < 0) {
        (activePlanProduction as any).message = 'Waiting Dandory Time';
        return activePlanProduction;
      }
      (activePlanProduction as any).message = null;
      return activePlanProduction;
    }
    throw new HttpException('No Active Plan', HttpStatus.NOT_FOUND);
  }

  async update(
    id: number,
    updatePlanningProductionDto: UpdatePlanningProductionDto,
  ) {
    const planning = await this.planningProductionRepository.findOne({
      where: { id: id },
    });
    if (planning) {
      if (planning.active_plan === true) {
        throw new HttpException('Plan Is Running Now', HttpStatus.BAD_REQUEST);
      }
      await this.planningProductionRepository.update(
        id,
        updatePlanningProductionDto,
      );
      return 'Plan Updated';
    }
    throw new HttpException('Planning Not Found', HttpStatus.BAD_REQUEST);
  }

  async convertTime(time: any) {
    const timeSplit = time.split(':');
    const minute = +timeSplit[0] * 60 + +timeSplit[1];
    return minute;
  }
}
