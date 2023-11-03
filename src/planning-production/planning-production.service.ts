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
import { PlanningProductionReportService } from 'src/planning-production-report/planning-production-report.service';
import { NoPlanMachineAdditionalService } from 'src/no-plan-machine-additional/no-plan-machine-additional.service';
import { ReportShiftService } from 'src/report-shift/report-shift.service';
import axios from 'axios';
import { ConditionMachineProductionService } from 'src/condition-machine-production/condition-machine-production.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FilterOperator, PaginateConfig, PaginateQuery, paginate } from 'nestjs-paginate';

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
    @Inject(forwardRef(() => PlanningProductionReportService))
    private planningProductionReportService: PlanningProductionReportService,
    @Inject(forwardRef(() => NoPlanMachineAdditionalService))
    private noPlanMachineAdditionalService: NoPlanMachineAdditionalService,
    @Inject(forwardRef(() => ReportShiftService))
    private reportShiftService: ReportShiftService,
    @Inject(forwardRef(() => ConditionMachineProductionService))
    private conditionMachineProductionService: ConditionMachineProductionService,
  ) {
    this.initializeMqttClient();
  }

  private async initializeMqttClient() {
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
    
    const getPlanActiveAll = await this.getPlanningActiveAll()

    if (getPlanActiveAll.length != 0) {
      getPlanActiveAll.map(plan => {
        this.subscribeToTopic(plan.machine.id, plan);
      })
    }

    // this.client.on('message', (topic, message) => {
    //   if (message) {
    //     // this.publish();
    //     this.publishMessage(topic, JSON.parse(message.toString()));
    //   }
    // });

    this.client.on('error', (error) => {
      console.log('Connection failed:', error);
    });
  }

  private subscribeToTopic(machineId: any, plan) {
    this.client.subscribe(`MC${machineId}:STOP:RPA`, { qos: 2 }, (err) => {
      if (err) {
        console.log(`Error subscribe topic : MC${machineId}:PLAN:RPA`, err);
      }
    });

    this.client.on("message", (topic, message: any) => {
      const topicSplit = topic.split(":")[0]
      // console.log(topicSplit.replace("MC", "") == plan.machine.id);
      if (topicSplit.replace("MC", "") == plan.machine.id) {
        message = JSON.parse(message)
        message.OperatorId = [plan?.user];
        message.ShiftName = [plan?.shift?.name ? plan.shift.name : ''];
        message.clientId = [plan?.client_id];
        message.PlanId = [plan?.id];
        const sendVariable = JSON.stringify(message);
        if (plan) {
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
    })
  }

  // private async publishMessage(
  //   topic: string,
  //   message: VariablePlanningProduction,
  // ) {
  //   const activePlanProduction =
  //     await this.planningProductionRepository.findOne({
  //       where: { active_plan: true },
  //       relations: ['shift'],
  //     });
  //   const topicSplit = topic.split(':')[0];
  //   // delete message.qty_actual;
  //   // delete message.qty_hour;
  //   console.log(message);

  //   message.OperatorId = [activePlanProduction?.user];
  //   message.ShiftName = [activePlanProduction?.shift?.name ?? ''];
  //   message.clientId = [activePlanProduction?.client_id];
  //   const sendVariable = JSON.stringify(message);
  //   if (activePlanProduction) {
  //     this.client.publish(
  //       `${topicSplit}:PLAN:RPA`,
  //       sendVariable,
  //       { qos: 2, retain: true },
  //       (error) => {
  //         if (error) {
  //           console.error('Error publishing message:', error);
  //         }
  //       },
  //     );
  //   }
  // }

  @Cron(CronExpression.EVERY_MINUTE)
  private async resetSection() {
    const allActivePlan = await this.getPlanningActiveAll()
    const timeNow = moment().format("HH:mm")
    const messageShiftTrue = {
      ResetSection: [true]
    }
    const messageShiftFalse = {
      ResetSection: [false]
    }
    allActivePlan.map(item => {
      // Jika waktu sekarang sama dengan waktu shift dimulai
      if (moment(timeNow, "HH:mm").isSame(moment(item.shift.time_start, "HH:mm"))) {
          this.client.publish(`MC${item.machine.id}:DR:RPA`,JSON.stringify(messageShiftTrue),{ qos: 2, retain: true },
            (error) => {
              if (error) {
                console.error('Error publishing message:', error);
              }
            }
          );
        setTimeout(() => {
          this.client.publish(`MC${item.machine.id}:DR:RPA`,JSON.stringify(messageShiftFalse),{ qos: 2, retain: true },
            (error) => {
              if (error) {
                console.error('Error publishing message:', error);
              }
            }
          );
        }, 2000);
      }
      
      // Jika waktu sekarang sama dengan waktu shift berakhir
      if (moment(timeNow, "HH:mm").isSame(moment(item.shift.time_end, "HH:mm"))) {
          this.client.publish(`MC${item.machine.id}:DR:RPA`,JSON.stringify(messageShiftTrue),{ qos: 2, retain: true },
            (error) => {
              if (error) {
                console.error('Error publishing message:', error);
              }
            }
          );
        setTimeout(() => {
          this.client.publish(`MC${item.machine.id}:DR:RPA`,JSON.stringify(messageShiftFalse),{ qos: 2, retain: true },
            (error) => {
              if (error) {
                console.error('Error publishing message:', error);
              }
            }
          );
        }, 2000);
      }
    })
  }

  private async resetPlanStatus(machineId, variablePlan, variableReset) {
    let message = {
      ResetTotal: [variableReset],
      PlanStatus: [variablePlan],
      Hour: [variableReset]
    }
    const sendVariable = JSON.stringify(message);
    this.client.publish(`MC${machineId}:DR:RPA`,sendVariable,{ qos: 2, retain: true },
      (error) => {
        if (error) {
          console.error('Error publishing message:', error);
        }
      },
    );
  }
  // CREATE PLANNING PRODUCTION
  async createPlanningProduction(
    createPlanningProductionDto: CreatePlanningProductionDto,
  ) {
    // cek aktif plan
    const isActivePlan = await this.planningProductionRepository.createQueryBuilder('planningProduction')
    .leftJoinAndSelect('planningProduction.shift', 'shift')
    .leftJoinAndSelect('planningProduction.machine', 'machine')
    .where('planningProduction.active_plan = :active', {active: true})
    .andWhere('planningProduction.client_id = :client_id', {client_id: createPlanningProductionDto.client_id})
    .andWhere('machine.id = :machine', {machine: createPlanningProductionDto.machine})
    .getOne()
    
    // cek product
    const product = await this.productService.findOne(
      +createPlanningProductionDto.product,
      createPlanningProductionDto.client_id,
    );

    const totalTimePlanning = (
      (product.cycle_time * createPlanningProductionDto.qty_planning) / 60
    );
    // jika tidak ada plan yang aktif dan tidak ada dandory time, AKTIF
    if (!isActivePlan) {
      // reset plan status mqtt activePlan start plan
      this.resetPlanStatus(createPlanningProductionDto.machine, false, true)
      setTimeout(() => {
        this.resetPlanStatus(createPlanningProductionDto.machine, false, false)
      }, 2000);
      const planStart = moment().format("HH:mm")
      const planEnd = moment(planStart, 'HH:mm').add(totalTimePlanning, 'minutes').format("HH:mm")
      
      const noPlanMachine = await this.noPlanMachineService.findAllNoPlanToday(createPlanningProductionDto.client_id)
      // cek no plan additional
      let totalNoPlanMachine = 0;
      noPlanMachine.map((res) => {
        const isWithinTimeRange =
        moment(res.time_in, 'HH:mm').isSameOrAfter(moment(planStart, 'HH:mm')) && moment(res.time_in, 'HH:mm').isSameOrBefore(moment(planEnd, 'HH:mm')) &&
        moment(res.time_out, 'HH:mm').isSameOrAfter(moment(planStart, 'HH:mm')) && moment(res.time_out, 'HH:mm').isSameOrBefore(moment(planEnd, 'HH:mm'));
      if (isWithinTimeRange) {
        totalNoPlanMachine += res.total;
      }
      });
  
      createPlanningProductionDto.active_plan = true;
      createPlanningProductionDto.date_time_in = moment().toDate();
      createPlanningProductionDto.total_time_planning = totalTimePlanning
      createPlanningProductionDto.qty_per_minute = Number((createPlanningProductionDto.qty_planning / (totalTimePlanning - totalNoPlanMachine)).toFixed(2))


      createPlanningProductionDto.dandory_time = null;
      const planningProduction = await this.planningProductionRepository.save(
        createPlanningProductionDto,
      );

      // buat no plan additional
      if (
        createPlanningProductionDto.time_in &&
        createPlanningProductionDto.time_out
      ) {
        try {
          const noPlanAdditional =
            await this.noPlanMachineAdditionalService.createAdditional(
              createPlanningProductionDto.time_in,
              createPlanningProductionDto.time_out,
              createPlanningProductionDto.client_id,
              planningProduction.id,
            );
        } catch (error) {
          return error;
        }
      }
      await this.conditionMachineProductionService.create(planningProduction.id, planningProduction.client_id)
      return planningProduction;

      // Jika ada dandory time dan plan aktif,MASUK ANTRIAN
    } else {
      createPlanningProductionDto.active_plan = false;
      createPlanningProductionDto.total_time_planning = totalTimePlanning
      const planningProduction = await this.planningProductionRepository.save(
        createPlanningProductionDto,
      );
      // buat no plan additional
      if (
        createPlanningProductionDto.time_in &&
        createPlanningProductionDto.time_out
      ) {
        try {
          const noPlanAdditional =
            await this.noPlanMachineAdditionalService.createAdditional(
              createPlanningProductionDto.time_in,
              createPlanningProductionDto.time_out,
              createPlanningProductionDto.client_id,
              planningProduction.id,
            );
        } catch (error) {
          return error;
        }
      }
      await this.conditionMachineProductionService.create(planningProduction.id, planningProduction.client_id)
      return planningProduction;
    }
  }

  async stopPlanningProduction(client_id: string, token, machineId) {
    // cek aktif plan
    const activePlan = await this.planningProductionRepository.createQueryBuilder('planningProduction')
    .leftJoinAndSelect('planningProduction.shift', 'shift')
    .leftJoinAndSelect('planningProduction.machine', 'machine')
    .leftJoinAndSelect('planningProduction.product', 'product')
    .where('planningProduction.active_plan = :active', {active: true})
    .andWhere('planningProduction.client_id = :client_id', {client_id})
    .andWhere('machine.id = :machine', {machine: machineId})
    .getOne()

    if (!activePlan) {
      return 'No Active Plan';
    }

    // cek plan berikutnya yang akan aktif
    const nextPlan = await this.planningProductionRepository
    .createQueryBuilder('planningProduction')
    .leftJoinAndSelect('planningProduction.shift', 'shift')
    .leftJoinAndSelect('planningProduction.machine', 'machine')
    .leftJoinAndSelect('planningProduction.product', 'product')
    .where('planningProduction.client_id = :client_id', { client_id: client_id })
    .andWhere('machine.id = :machine', { machine: machineId })
    .andWhere('planningProduction.id > :activePlanId', { activePlanId: activePlan.id })
    .orderBy('planningProduction.id', 'ASC')  
    .getOne()

    const noPlanMachine = await this.noPlanMachineService.findAllNoPlanToday(activePlan.client_id)
    const totalTimePlanning = (activePlan.product.cycle_time * activePlan.qty_planning) / 60
    const planStart = moment(activePlan.date_time_in).format("HH:mm")
    const planEnd = moment(planStart, 'HH:mm').add(totalTimePlanning, 'minutes').format("HH:mm")

    // cek no plan additional
    const noPlanMachineAdditional = await this.noPlanMachineAdditionalService.findOne(activePlan.id);
    const noPlanMachineAdditionalTotal = noPlanMachineAdditional
      ? noPlanMachineAdditional.total
      : 0;
    // cek no plan additional
    let totalNoPlanMachine = 0 + noPlanMachineAdditionalTotal;
    noPlanMachine.map((res) => {
      const isWithinTimeRange =
        moment(res.time_in, 'HH:mm').isSameOrAfter(moment(planStart, 'HH:mm')) && moment(res.time_in, 'HH:mm').isSameOrBefore(moment(planEnd, 'HH:mm')) &&
        moment(res.time_out, 'HH:mm').isSameOrAfter(moment(planStart, 'HH:mm')) && moment(res.time_out, 'HH:mm').isSameOrBefore(moment(planEnd, 'HH:mm'));
      if (isWithinTimeRange) {
        totalNoPlanMachine += res.total;
      }
    });

    // convert time in ke menit
    const timeIn = new Date(activePlan.date_time_in).toLocaleTimeString(
      'it-IT',
    );

    // convert time out ke menit
    const activePlanDateTimeOut = moment().toDate();
    const timeOut = new Date(activePlanDateTimeOut).toLocaleTimeString('it-IT');
    // selisih waktu masuk dan keluar dalam menit
    // const differenceTime =
    //   (await this.convertTime(timeOut)) - (await this.convertTime(timeIn));
    const differenceTime = moment(timeOut, 'HH:mm:ss').diff(moment(timeIn, 'HH:mm:ss'), 'minute')

    // const qty = activePlan.qty_planning / (differenceTime - totalNoPlanMachine);
    const qty = activePlan.qty_planning / ((differenceTime - totalNoPlanMachine) == 0 ? 1 : (differenceTime - totalNoPlanMachine));


    if (nextPlan) {
      if (nextPlan.dandory_time != 0) {
        // for save last production
        await axios.post(
          `${process.env.SERVICE_PRODUCTION}/production/stopped`,
          {
            clientId: activePlan.client_id,
            planning_production_id: activePlan.id,
            machine: activePlan.machine.id
          },
        );

        await this.planningProductionRepository.update(activePlan.id, {
          // active_plan: false,
          dandory_time: -1,
          date_time_out: activePlanDateTimeOut,
          total_time_actual: differenceTime,
          // qty_per_minute: parseFloat(qty.toFixed(2)),
          qty_per_hour: Math.round(qty * 60),
        });
        setTimeout(async () => {
          // reset plan status mqtt nextPlan start plan
          this.resetPlanStatus(nextPlan.machine.id, false, true)
          setTimeout(() => {
            this.resetPlanStatus(nextPlan.machine.id, false, false)
          }, 2000);

          // reset plan status mqtt activePlan stop plan
          this.resetPlanStatus(activePlan.machine.id, true, true)
          setTimeout(() => {
            this.resetPlanStatus(activePlan.machine.id, true, false)
          }, 2000);

          const planStart = moment().format("HH:mm")
          const planEnd = moment(planStart, 'HH:mm').add(nextPlan.total_time_planning, 'minutes').format("HH:mm")
          const noPlanMachine = await this.noPlanMachineService.findAllNoPlanToday(nextPlan.client_id)
        // cek no plan additional
        let totalNoPlanMachine = 0;
        noPlanMachine.map((res) => {
            const isWithinTimeRange =
            moment(res.time_in, 'HH:mm').isSameOrAfter(moment(planStart, 'HH:mm')) && moment(res.time_in, 'HH:mm').isSameOrBefore(moment(planEnd, 'HH:mm')) &&
            moment(res.time_out, 'HH:mm').isSameOrAfter(moment(planStart, 'HH:mm')) && moment(res.time_out, 'HH:mm').isSameOrBefore(moment(planEnd, 'HH:mm'));
          if (isWithinTimeRange) {
            totalNoPlanMachine += res.total;
          }
        });
        
          // for save last production
          await axios.post(
            `${process.env.SERVICE_PRODUCTION}/production/stopped`,
            {
              clientId: activePlan.client_id,
              planning_production_id: activePlan.id,
              machine: activePlan.machine.id
            },
          );

          await this.planningProductionRepository.update(nextPlan.id, {
            active_plan: true,
            dandory_time: null,
            date_time_in: moment().toDate(),
            qty_per_minute:  nextPlan.qty_per_minute = Number((nextPlan.qty_planning / (nextPlan.total_time_planning - totalNoPlanMachine)).toFixed(2))
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
        // reset plan status mqtt nextPlan start plan
        this.resetPlanStatus(nextPlan.machine.id, false, true)
        setTimeout(() => {
          this.resetPlanStatus(nextPlan.machine.id, false, false)
        }, 2000);

        // reset plan status mqtt activePlan stop plan
        this.resetPlanStatus(activePlan.machine.id, true, true)
        setTimeout(() => {
          this.resetPlanStatus(activePlan.machine.id, true, false)
        }, 2000);

        // for save last production
        await axios.post(
          `${process.env.SERVICE_PRODUCTION}/production/stopped`,
          {
            clientId: activePlan.client_id,
            planning_production_id: activePlan.id,
            machine: activePlan.machine.id
          },
        );
        await this.planningProductionRepository.update(activePlan.id, {
          active_plan: false,
          date_time_out: activePlanDateTimeOut,
          total_time_actual: differenceTime,
          // qty_per_minute: parseFloat(qty.toFixed(2)),
          qty_per_hour: Math.round(qty * 60),
        });

         // for save last production
         const planStart = moment().format("HH:mm")
         const planEnd = moment(planStart, 'HH:mm').add(nextPlan.total_time_planning, 'minutes').format("HH:mm")
         const noPlanMachine = await this.noPlanMachineService.findAllNoPlanToday(nextPlan.client_id)
        // cek no plan additional
        let totalNoPlanMachine = 0;
        noPlanMachine.map((res) => {
            const isWithinTimeRange =
            moment(res.time_out, 'HH:mm').isSameOrBefore(moment(planEnd, 'HH:mm'));          if (isWithinTimeRange) {
            totalNoPlanMachine += res.total;
          }
        });
        await this.planningProductionRepository.update(nextPlan.id, {
          active_plan: true,
          date_time_in: moment().toDate(),
          qty_per_minute:  nextPlan.qty_per_minute = Number((nextPlan.qty_planning / (nextPlan.total_time_planning - totalNoPlanMachine)).toFixed(2))
        });
        const newNextPlan = this.planningProductionRepository.findOne({
          where: { id: nextPlan.id, client_id },
        });
        return `Plan has been Stopped, Activate Next Plan`;
      }
    }
    // reset plan status mqtt activePlan stop plan
    this.resetPlanStatus(activePlan.machine.id, true, true)
    setTimeout(() => {
      this.resetPlanStatus(activePlan.machine.id, true, false)
    }, 2000);
    // for save last production
    await axios.post(`${process.env.SERVICE_PRODUCTION}/production/stopped`, {
      clientId: activePlan.client_id,
      planning_production_id: activePlan.id,
      machine: activePlan.machine.id
    });

    await this.planningProductionRepository.update(activePlan.id, {
      active_plan: false,
      date_time_out: activePlanDateTimeOut,
      total_time_actual: differenceTime,
      // qty_per_minute: parseFloat(qty.toFixed(2)),
      qty_per_hour: Math.round(qty * 60),
    });

    // for create report
    activePlan.date_time_out = activePlanDateTimeOut;
    // activePlan.qty_per_hour = parseFloat(qty.toFixed(2));
    activePlan.qty_per_hour = Math.round(qty * 60);
    activePlan.total_time_actual = differenceTime;
    await this.planningProductionReportService.create(
      { planning: activePlan },
      token,
    );

    // for Create report shift
    // await this.reportShiftService.saveReportIfStop(activePlan);

    // return 'All Plan In Queue Has Been Finished';
    return 'No Plan In Queue, No Active Plan';
  }

  async getPlanningProduction(client_id: string) {
    const activePlanProduction =
      await this.planningProductionRepository.findOne({
        where: { active_plan: true, client_id: client_id },
        relations: ['shift', 'shift.no_plan_machine_id', 'product', 'machine'],
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
    // throw new HttpException('No Active Plan', HttpStatus.NOT_FOUND);
  }

  async getPlanningProductionByMachine(client_id: string, machine) {
    let activePlanProduction
      if (machine != 'null' && machine != 'undefined') {
        activePlanProduction = await this.planningProductionRepository
        .createQueryBuilder('planningProduction')
        .leftJoinAndSelect('planningProduction.shift', 'shift')
        .leftJoinAndSelect('planningProduction.machine', 'machine')
        .leftJoinAndSelect('planningProduction.product', 'product')
        .leftJoinAndSelect('shift.no_plan_machine_id', 'no_plan_machine_id')
        .where('planningProduction.active_plan = :active', {active: true})
        .andWhere('planningProduction.client_id = :client_id', {client_id})
        .andWhere('machine.id = :machine', {machine})
        .getOne()
      }
      
    if (activePlanProduction) {
      // jika dandory time plan active negative, berarti sedang menunggu dandory time dari plan berikutnya untuk aktif
      if (activePlanProduction.dandory_time < 0) {
        (activePlanProduction as any).message = 'Waiting Dandory Time';
        return activePlanProduction;
      }
      (activePlanProduction as any).message = null;
      return activePlanProduction;
    }
    // return null
    throw new HttpException('No Active Plan', HttpStatus.NOT_FOUND);
  }

  async getLastPlanning(client_id: string) {
    const lastPlan = await this.planningProductionRepository.findOne({
      where: {
        client_id: client_id,
        active_plan: false,
        date_time_out: Not(IsNull()),
      },
      order: { id: 'desc' },
    });
    return lastPlan;
  }

  async convertTime(time: any) {
    const timeSplit = time.split(':');
    const minute = +timeSplit[0] * 60 + +timeSplit[1];
    return minute;
  }

  // async initializeMqttClientSpesifikMachine(machineId: number) {
  //   const connectUrl = process.env.MQTT_CONNECTION;

  //   this.client = mqtt.connect(connectUrl, {
  //     clientId: `mqtt_nest_${Math.random().toString(16).slice(3)}`,
  //     clean: true,
  //     connectTimeout: 4000,
  //     username: '',
  //     password: '',
  //     reconnectPeriod: 1000,
  //   });

  //   this.client.on('connect', () => {
  //     console.log('MQTT client connected');
  //   });

  //   this.client.subscribe(`MC${machineId}:STOP:RPA`, { qos: 2 }, (err) => {
  //     if (err) {
  //       console.log(`Error subscribe topic : MC${machineId}:PLAN:RPA`, err);
  //     }
  //   });

  //   this.client.on('message', (topic, message) => {
  //     if (message) {
  //       // this.publish();
  //       return JSON.parse(message.toString());
  //     }
  //   });

  //   this.client.on('error', (error) => {
  //     console.log('Connection failed:', error);
  //   });
  //   this.client.end();
  // }

  async getPlanningActive(cleintId: string) {
    return await this.planningProductionRepository.find({
      where: {
        client_id: cleintId,
        active_plan: true,
      },
      relations: ['machine', 'product', 'shift'],
    });
  }

  getPlanningActiveAll() {
    return this.planningProductionRepository.find({
      where: {
        active_plan: true,
      },
      relations: ['machine', 'product', 'shift'],
    });
  }

  getAllData(query: PaginateQuery, clientId: any) {
    const queryBuilder = this.planningProductionRepository
      .createQueryBuilder('planningProduction')
      .leftJoinAndSelect('planningProduction.machine', 'machine')
      .leftJoinAndSelect('planningProduction.product', 'product')
      .leftJoinAndSelect('planningProduction.shift', 'shift')
      .where('planningProduction.client_id = :client_id', { client_id: clientId });
    var filterableColumns = {};
    if (query.filter?.['machine']) {
      const nameFilter = `%${query.filter['machine']}%`;
      queryBuilder.andWhere('machine.name ILIKE :machine', { machine: nameFilter });
    }
    if (query.filter?.['status']) {
      if (query.filter.status == 'idle') {
        queryBuilder.andWhere('planningProduction.active_plan = false AND planningProduction.date_time_out IS NULL');
      }
      if (query.filter.status == 'run') {
        queryBuilder.andWhere('planningProduction.active_plan = true');
      }
      if (query.filter.status == 'stop') {
        queryBuilder.andWhere('planningProduction.active_plan = false AND planningProduction.date_time_out IS NOT NULL');
      }
    }
    if (query.filter?.['qtyReject']) {
      if (query.filter.qtyReject == '1') {
        queryBuilder.andWhere('planningProduction.qty_reject != 0');
      } 
      if(query.filter.qtyReject == '0') {
        queryBuilder.andWhere('planningProduction.qty_reject = 0');
      }
    }
    const config: PaginateConfig<PlanningProduction> = {
      sortableColumns: ['id'],
      searchableColumns: ['machine'],
      filterableColumns,
    };

    return paginate<PlanningProduction>(query, queryBuilder, config);
  }

  async updateQtyReject(id: string, updatePlanningProductionDto: UpdatePlanningProductionDto) {
    const plan = await this.planningProductionRepository.findOne({
      where: {id: +id}
    })

    if (plan) {
      if (plan.active_plan == false && plan.date_time_out) {
        const planUpdate = await this.planningProductionRepository.update(id, updatePlanningProductionDto)
        return planUpdate
      }
      throw new HttpException("Plan still running or not start yet", HttpStatus.BAD_REQUEST);
    }
    throw new HttpException("Plan Not Found", HttpStatus.BAD_REQUEST);
  }
  
  async findOne(id) {
    const plan = await this.planningProductionRepository.findOne({
      where: {id: +id}
    })

    if (plan) {
      return plan
    }
    throw new HttpException("Plan Not Found", HttpStatus.BAD_REQUEST);
  }

  async getAllPlanByClient(query: PaginateQuery, client: string) {
    const queryBuilder = this.planningProductionRepository
      .createQueryBuilder('planningProduction')
      .leftJoinAndSelect('planningProduction.shift', 'shift')
      .leftJoinAndSelect('planningProduction.product', 'product')
      .leftJoinAndSelect('planningProduction.machine', 'machine')
      .leftJoinAndSelect('shift.no_plan_machine_id', 'no_plan_machine_id')
      .where('planningProduction.client_id = :client_id', { client_id: client })
      if (query.filter?.['dateTimeIn']) {
        queryBuilder.andWhere('DATE(planningProduction.date_time_in)= :dateTimeIn', { dateTimeIn: query?.filter?.dateTimeIn })
      }

    return queryBuilder.getMany()
  }
  
  async getQtyReject(clientId, dateTimeIn, dateTimeOut) {
    return this.planningProductionRepository.findOne({
      where: {
        client_id: clientId,
        date_time_in: dateTimeIn,
        date_time_out: dateTimeOut,
      }
    })
  }
}
