import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportShift } from './entities/report-shift.entity';
import { Repository } from 'typeorm';
import { Shift } from 'src/shift/entities/shift.entity';
import { ShiftService } from 'src/shift/shift.service';
import * as moment from 'moment';
import * as mqtt from 'mqtt';
import { PlanningProductionService } from 'src/planning-production/planning-production.service';
import { PlanningProduction } from 'src/planning-production/entities/planning-production.entity';
import { NoPlanMachine } from 'src/no-plan-machine/entities/no-plan-machine.entity';

@Injectable()
export class ReportShiftService {
  private client: mqtt.MqttClient;
  constructor(
    @InjectRepository(ReportShift)
    private readonly reportShiftRepository: Repository<ReportShift>,
    @Inject(forwardRef(() => ShiftService))
    private readonly shiftService: ShiftService,
    @Inject(forwardRef(() => PlanningProductionService))
    private readonly planningProductionService: PlanningProductionService,
  ) {}

  async handleScehdule() {
    const shiftAll = await this.shiftService.findAllWithoutFilterClient();
    const timeNow = moment().format('YYYY-MM-DD HH:mm');
    shiftAll.map((item) => {
      const getDate = moment().format('YYYY-MM-DD');
      const dateTimeOut = moment(
        `${getDate} ${item.time_end}`,
        'YYYY-MM-DD HH:mm',
      );

      if (dateTimeOut.isSame(timeNow)) {
        this.logicStoreReport(item);
      }
    });
  }

  async logicStoreReport(shift: Shift) {
    const plannings = await this.planningProductionService.getPlanningActive(
      shift.client_id,
    );
    if (plannings) {
      await Promise.all(
        plannings.map(async (item) => {
          const getMessage = await this.initializeMqttClientSpesifikMachine(
            item.machine.id,
          );

          await this.saveReportSchadule(item, getMessage, shift);
        }),
      );
    }
    return true;
  }

  async initializeMqttClientSpesifikMachine(machineId: number) {
    return new Promise((resolve, reject) => {
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

      this.client.subscribe(`MC${machineId}:PLAN:RPA`, { qos: 2 }, (err) => {
        if (err) {
          console.log(`Error subscribe topic : MC${machineId}:PLAN:RPA`, err);
        }
      });

      this.client.on('message', (topic, message) => {
        if (message) {
          resolve(JSON.parse(message.toString()));
        } else {
          reject(new Error('Empty message received'));
        }
      });

      this.client.on('error', (error) => {
        console.log('Connection failed:', error);
      });
      this.client.end();
    });
  }

  async saveReportSchadule(
    planning: PlanningProduction,
    message: any,
    shift: Shift,
  ) {
    const reportShiftSebelumya = await this.reportShiftRepository.findOne({
      where: {
        planning_id: planning.id,
      },
    });
    const noPlanning = shift.no_plan_machine_id
      .filter((item) => item.day == moment().format('dddd').toLocaleLowerCase())
      .reduce((accumulator, item) => accumulator + item.total * 60, 0);

    const startTime = moment(shift.time_start, 'HH:mm:ss');
    const endTime = moment(shift.time_end, 'HH:mm:ss');

    const durationInSeconds = endTime.diff(startTime, 'seconds');

    const reportShift = new ReportShift();
    reportShift.client_id = planning.client_id;
    reportShift.machine_name = planning.machine.name;
    reportShift.product_part_name = planning.product.part_name;
    reportShift.product_part_number = planning.product.part_number;
    reportShift.product_cycle_time = planning.product.cycle_time;
    reportShift.shift = shift.name;
    reportShift.qty_plan =
      (durationInSeconds - noPlanning) / planning.product.cycle_time;
    reportShift.total_planning = planning.total_time_planning;
    reportShift.no_plan = noPlanning;
    reportShift.oprator_name = planning.user;
    reportShift.qty_actual = reportShiftSebelumya
      ? message['qty_actual'][0] - reportShift.qty_actual
      : message['qty_actual'][0];
    reportShift.planning_id = planning.id;
  }

  async saveReportIfStop(planning: PlanningProduction) {
    const reportShiftSebelumya = await this.reportShiftRepository.findOne({
      where: {
        planning_id: planning.id,
      },
    });
    const getShift = await this.shiftService.getShiftBatewinByTimeEnd(
      planning.client_id,
      moment(planning.date_time_out).format('HH:mm:ss'),
    );

    const noPlan = await this.noPlanCount(
      getShift.no_plan_machine_id,
      planning.date_time_out,
    );

    const startTime = moment(getShift.time_start, 'HH:mm:ss');
    const endTime = moment(planning.date_time_out, 'HH:mm:ss');

    const durationInSeconds = endTime.diff(startTime, 'seconds');

    const message = await this.initializeMqttClientSpesifikMachine(
      planning.machine.id,
    );

    const reportShift = new ReportShift();
    reportShift.client_id = planning.client_id;
    reportShift.machine_name = planning.machine.name;
    reportShift.product_part_name = planning.product.part_name;
    reportShift.product_part_number = planning.product.part_number;
    reportShift.product_cycle_time = planning.product.cycle_time;
    reportShift.shift = getShift.name;
    reportShift.qty_plan =
      (durationInSeconds - noPlan) / planning.product.cycle_time;
    reportShift.total_planning = planning.total_time_planning;
    reportShift.no_plan = noPlan;
    reportShift.oprator_name = planning.user;
    reportShift.qty_actual = reportShiftSebelumya
      ? message['qty_actual'][0] - reportShift.qty_actual
      : message['qty_actual'][0];
    reportShift.planning_id = planning.id;
  }

  async noPlanCount(noPlanning: NoPlanMachine[], jamStop: Date) {
    const jamPulang = moment(jamStop, 'HH:mm:ss');

    let totalDurasiDetik = 0;
    let isJamPulangFound = false;

    for (const istirahat of noPlanning) {
      const waktuMulai = moment(istirahat.time_in, 'HH:mm:ss');
      const waktuSelesai = moment(istirahat.time_out, 'HH:mm:ss');

      if (isJamPulangFound) {
        break; // Keluar dari loop jika jam pulang sudah ditemukan
      }

      if (jamPulang.isBetween(waktuMulai, waktuSelesai)) {
        totalDurasiDetik += jamPulang.diff(waktuMulai, 'seconds');
        isJamPulangFound = true; // Menandai bahwa jam pulang sudah ditemukan
      } else {
        totalDurasiDetik += waktuSelesai.diff(waktuMulai, 'seconds');
      }
    }

    return totalDurasiDetik;
  }
}
