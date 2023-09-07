import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportShift } from './entities/report-shift.entity';
import { Repository } from 'typeorm';
import { Shift } from 'src/shift/entities/shift.entity';
import { ShiftService } from 'src/shift/shift.service';
import * as moment from 'moment';
import * as mqtt from 'mqtt';
import { PlanningProductionService } from 'src/planning-production/planning-production.service';

@Injectable()
export class ReportShiftService {
  private client: mqtt.MqttClient;
  constructor(
    @InjectRepository(ReportShift)
    private readonly reportShift: Repository<ReportShift>,
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
        this.storeReport(item);
      }
    });
  }

  async storeReport(shift: Shift) {
    const plannings = await this.planningProductionService.getPlanningActive(
      shift.client_id,
    );
  }

  async initializeMqttClientSpesifikMachine(machineId: number) {
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

    this.client.subscribe(`MC${machineId}:STOP:RPA`, { qos: 2 }, (err) => {
      if (err) {
        console.log(`Error subscribe topic : MC${machineId}:PLAN:RPA`, err);
      }
    });

    this.client.on('message', (topic, message) => {
      if (message) {
        // this.publish();
        return JSON.parse(message.toString());
      }
    });

    this.client.on('error', (error) => {
      console.log('Connection failed:', error);
    });
    this.client.end();
  }
}
