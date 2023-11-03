import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { CreatePlanningProductionReportDto } from './dto/create-planning-production-report.dto';
import { UpdatePlanningProductionReportDto } from './dto/update-planning-production-report.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanningProductionReport } from './entities/planning-production-report.entity';
import { Repository } from 'typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  paginate,
} from 'nestjs-paginate';
import axios from 'axios';
import { ProductionReportLineStopService } from 'src/production-report-line-stop/production-report-line-stop.service';
import { VariableResponLineStopReport } from 'src/interface/variable-respon-line-stop-reort.interface';
import * as moment from 'moment';
import { ShiftService } from 'src/shift/shift.service';
import { PlanningProductionService } from '../planning-production/planning-production.service';
import { NoPlanMachineService } from 'src/no-plan-machine/no-plan-machine.service';

@Injectable()
export class PlanningProductionReportService {
  constructor(
    @InjectRepository(PlanningProductionReport)
    private readonly planningProductionReportRepository: Repository<PlanningProductionReport>,
    @Inject(forwardRef(() => ProductionReportLineStopService))
    private readonly productionReportLineStopService: ProductionReportLineStopService,
    @Inject(forwardRef(() => ShiftService))
    private readonly shiftService: ShiftService,
    @Inject(forwardRef(() => PlanningProductionService))
    private readonly planningProductionService: PlanningProductionService,
    @Inject(forwardRef(() => NoPlanMachineService))
    private readonly noPlanMachineService: NoPlanMachineService,
  ) {}

  getReport(query: PaginateQuery) {
    const queryBuilder =
      this.planningProductionReportRepository.createQueryBuilder(
        'planningProductionReport',
      );
    const startDate = query?.filter?.startDate;
    const endDate = query?.filter?.endDate;

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'planningProductionReport.created_at BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }
    var filterableColumns = {};
    if (query.filter?.['product_part_name']) {
      filterableColumns['product_part_name'] = [FilterOperator.EQ];
    }

    const config: PaginateConfig<PlanningProductionReport> = {
      sortableColumns: ['id'],
      searchableColumns: ['product_part_name'],
      filterableColumns,
    };

    return paginate<PlanningProductionReport>(query, queryBuilder, config);
  }

  async create(
    createPlanningProductionReportDto: CreatePlanningProductionReportDto,
    token: string,
  ) {
    const lastProduction = (
      await axios.get(
        `${process.env.SERVICE_PER_JAM}/production/last-production/${createPlanningProductionReportDto.planning.id}`,
      )
    ).data.data;

    const saveData = await this.planningProductionReportRepository.save({
      client_id: createPlanningProductionReportDto.planning.client_id,
      // SHIFT
      shift_start: (
        await this.shiftService.getShiftBatewinByTimeStart(
          createPlanningProductionReportDto.planning.client_id,
          moment(
            createPlanningProductionReportDto.planning.date_time_in,
          ).format('HH:mm:ss'),
        )
      ).name,
      shift_end: (
        await this.shiftService.getShiftBatewinByTimeEnd(
          createPlanningProductionReportDto.planning.client_id,
          moment(
            createPlanningProductionReportDto.planning.date_time_out,
          ).format('HH:mm:ss'),
        )
      ).name,
      // product
      product_part_name:
        createPlanningProductionReportDto.planning.product.part_name,
      product_part_number:
        createPlanningProductionReportDto.planning.product.part_number,
      product_cycle_time:
        createPlanningProductionReportDto.planning.product.cycle_time,
      // MCHINE
      machine_name: createPlanningProductionReportDto.planning.machine.name,
      machine_number: createPlanningProductionReportDto.planning.machine.number,
      // PLANNING
      qty_planning: createPlanningProductionReportDto.planning.qty_planning,
      planning_date_time_in:
        createPlanningProductionReportDto.planning.date_time_in,
      planning_date_time_out:
        createPlanningProductionReportDto.planning.date_time_out,
      planning_total:
        createPlanningProductionReportDto.planning.total_time_planning,

      oprator: createPlanningProductionReportDto.planning.user,
      production_qty_actual: Number(lastProduction.qty_actual),
    });

    const respons = (
      await axios.post(
        `${process.env.SERVICE_LOSS_TIME}/report-line-stop/line-stops`,
        {
          dateIn: createPlanningProductionReportDto.planning.date_time_in,
          dateEnd: createPlanningProductionReportDto.planning.date_time_out,
          planningId: createPlanningProductionReportDto.planning.id,
        },
        {
          headers: {
            Authorization: token,
          },
        },
      )
    ).data;

    const datas: VariableResponLineStopReport[] = respons.data;
    if (datas && datas.length > 0) {
      datas.map((item) =>
        this.productionReportLineStopService.create({
          planningProductionReport: saveData,
          timeTotal: moment.duration(item.sum, 'seconds').minutes(),
          lineStopName: item.lineStop_name,
        }),
      );
    }
  }

  async reportOee(client_id) {
    const startDate = moment().startOf('month')
    const endDate = moment().endOf('month')
    const data = await Promise.all(this.range(0, endDate.diff(startDate, 'day')).map(async value => {
      let date = moment(startDate, 'YYYY-MM-DD')
      date = moment(date).add(value, 'day')
      const planMap = await this.planningProductionReportRepository.createQueryBuilder('planningProductionReport')
      .leftJoinAndSelect('planningProductionReport.productionReportLineStop', 'productionReportLineStop')
      .where('planningProductionReport.client_id = :client_id', {client_id: client_id})
      .andWhere(`EXTRACT(MONTH FROM planningProductionReport.planning_date_time_in) = :month`, {month: moment().format('MM')})
      .andWhere(`Date(planning_date_time_in) = :date`, {date: date.format('YYYY-MM-DD')})
      .getMany()

        const planningMapping = await Promise.all(planMap.map(async (productionReport) => {
          let dateTimeIn = productionReport.planning_date_time_in;
          let dateTimeOut = productionReport.planning_date_time_out;
          let timeInMinute = moment(dateTimeOut).diff(moment(dateTimeIn), 'minute');
          let qtyPlanning = productionReport.qty_planning;
          let qtyActual = productionReport.production_qty_actual ?? 0;
          let qtyReject = (await this.planningProductionService.getQtyReject(client_id, dateTimeIn, dateTimeOut))?.qty_reject ?? 0;
          let lineStopOther = productionReport.productionReportLineStop.reduce((total, value) => total + value.timeTotal, 0) ?? 0
          
          let plannedProduction = timeInMinute;
          let actualProduction = timeInMinute - lineStopOther;
          let roundPercentage = Math.round((actualProduction / plannedProduction) * 100);
          let round = (actualProduction / plannedProduction);
          if (isNaN(round) || isNaN(roundPercentage)) {
            round = 0
          }
          let availability = {plannedProduction, actualProduction, roundPercentage, round}
          
          let totalPlanQuantityProduction = qtyPlanning;
          let actualQuantityProduction = qtyActual;
          let totalProduction = qtyActual;
          let upTime = timeInMinute - lineStopOther;
          let performance = Math.round(totalProduction / upTime);
          roundPercentage = Math.round((actualQuantityProduction / totalPlanQuantityProduction) * 100)
          round = (actualQuantityProduction / totalPlanQuantityProduction)

          let performancePercentage = Math.round((productionReport.product_cycle_time * productionReport.production_qty_actual / 60) / timeInMinute * 100)
          let performances = {
            totalPlanQuantityProduction,
            actualQuantityProduction,
            totalProduction,
            upTime,
            performance,
            roundPercentage,
            round,
            performancePercentage
          }
          
          totalProduction = qtyActual;
          let totalProductOk = qtyActual - qtyReject
          roundPercentage = Math.round((totalProductOk / totalProduction) * 100);
          round = (totalProductOk / totalProduction);
          if (isNaN(roundPercentage) || isNaN(round)) {
            roundPercentage = 0;
            round = 0;
          }
  
          let qualityPercentage = Math.round(productionReport.production_qty_actual / (productionReport.production_qty_actual - 0) * 100)
          let quality = {
            totalProduction,
            totalProductOk,
            roundPercentage,
            round,
            qualityPercentage
          }

          let oee = Math.round((availability['round'] * performances['round'] * quality['round']) * 100)
          return {
            dateTimeIn, dateTimeOut, timeInMinute, qtyPlanning, qtyActual, qtyReject, lineStopOther, availability, performances, quality, oee
          }
        })
      )
      
      const initialValue = {
        availability: { plannedProduction: 0, actualProduction: 0, roundPercentage: 0, round: 0 },
        performances: {
          totalPlanQuantityProduction: 0,
          actualQuantityProduction: 0,
          totalProduction: 0,
          upTime: 0,
          performances: 0.0,
          roundPercentage: 0.0,
          round: 0,
          performancePercentage: 0
        },
        quality: { totalProduction: 0, totalProductOk: 0, roundPercentage: 0, round: 0, qualityPercentage: 0 },
        oee: 0.0,
      };
      
      const reduceMap = planningMapping.reduce((total, prefix) => {
        total.availability.plannedProduction += Number(prefix.availability.plannedProduction);
        total.availability.actualProduction += Number(prefix.availability.actualProduction);
        total.availability.roundPercentage += Number(prefix.availability.roundPercentage);
        total.availability.round += Number(prefix.availability.round);
        total.performances.totalPlanQuantityProduction += Number(prefix.performances.totalPlanQuantityProduction);
        total.performances.actualQuantityProduction += Number(prefix.performances.actualQuantityProduction);
        total.performances.totalProduction += Number(prefix.performances.totalProduction);
        total.performances.upTime += Number(prefix.performances.upTime);
        total.performances.performances += Number(prefix.performances.performance);
        total.performances.roundPercentage += Number(prefix.performances.roundPercentage);
        total.performances.round += Number(prefix.performances.round);
        total.performances.performancePercentage += Number(prefix.performances.performancePercentage);
        total.quality.totalProduction += Number(prefix.quality.totalProduction);
        total.quality.totalProductOk += Number(prefix.quality.totalProductOk);
        total.quality.roundPercentage += Number(prefix.quality.roundPercentage);
        total.quality.round += Number(prefix.quality.round);
        total.quality.qualityPercentage += Number(prefix.quality.qualityPercentage);
        total.oee += Number(prefix.oee);
        return total;
      }, initialValue);
      
      let round_ava;
      let round_per;
      let round_qua;
      let oee;
        
      round_ava = reduceMap['availability']['actualProduction'] / reduceMap['availability']['plannedProduction'];
      round_per = reduceMap['performances']['actualQuantityProduction'] / reduceMap['performances']['totalPlanQuantityProduction'];
      if (isNaN(round_ava) || isNaN(round_per)) {
        round_ava = 0;
        round_per = 0;
      }

      round_qua = reduceMap['quality']['totalProductOk'] / reduceMap['quality']['totalProduction'];
      if (isNaN(round_qua)) {
        round_qua = 0;
      }

      oee = Number(((round_ava) * (round_per) * (round_qua) * 100).toFixed(1));
      if (isNaN(oee)) {
        oee = 0;
      }
      const availabilityPercentage = reduceMap['availability']['roundPercentage']
      const performancePercentage = reduceMap['performances']['performancePercentage']
      const qualityPercentage = reduceMap['quality']['qualityPercentage']
      
      return {oee, availabilityPercentage, performancePercentage, qualityPercentage}
    }))
    
    return {
      start: moment().startOf('month').format('YYYY-MM-DD'),
      end: moment().endOf('month').format('YYYY-MM-DD'),
      data: data,
      month: {
        label: `${moment().startOf('year').format('DD MMM')} - ${moment().subtract(1, 'month').endOf('month').format('DD MMM')}`,
        value: await this.monthAgo(client_id)
      },
      one: {
        label: moment().subtract(1, 'year').format('YYYY'),
        value: await this.oneYearAgo(client_id)
      },
      two: {
        label: moment().subtract(2, 'year').format('YYYY'),
        value: await this.twoYearAgo(client_id)
      },
    }
  }

  async monthAgo(client_id) {
    const startDateMonthAgo = moment().startOf('year').format('YYYY-MM-DD HH:mm:ss');
    const endDateMonthAgo = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD HH:mm:ss');

    const planMap = await this.planningProductionReportRepository.createQueryBuilder('planningProductionReport')
    .leftJoinAndSelect('planningProductionReport.productionReportLineStop', 'productionReportLineStop')
    .where('planningProductionReport.client_id = :client_id', {client_id: client_id})
    .andWhere(`planningProductionReport.planning_date_time_in BETWEEN :startDateMonthAgo AND :endDateMonthAgo`, {
      startDateMonthAgo, endDateMonthAgo
    })
    .getMany()

    const planningMapping = await Promise.all(planMap.map(async (productionReport) => {
        let dateTimeIn = productionReport.planning_date_time_in;
        let dateTimeOut = productionReport.planning_date_time_out;
        let timeInMinute = moment(dateTimeOut).diff(moment(dateTimeIn), 'minute');
        let qtyPlanning = productionReport.qty_planning;
        let qtyActual = productionReport.production_qty_actual ?? 0;
        let qtyReject = (await this.planningProductionService.getQtyReject(client_id, dateTimeIn, dateTimeOut))?.qty_reject ?? 0;
        let lineStopOther = productionReport.productionReportLineStop.reduce((total, value) => total + value.timeTotal, 0) ?? 0
        
        let plannedProduction = timeInMinute;
        let actualProduction = timeInMinute - lineStopOther;
        let roundPercentage = Math.round((actualProduction / plannedProduction) * 100);
        let round = (actualProduction / plannedProduction);
        let availability = {plannedProduction, actualProduction, roundPercentage, round}
        
        let totalPlanQuantityProduction = qtyPlanning;
        let actualQuantityProduction = qtyActual;
        let totalProduction = qtyActual;
        let upTime = timeInMinute - lineStopOther;
        let performance = Math.round(totalProduction / upTime);
        roundPercentage = Math.round((actualQuantityProduction / totalPlanQuantityProduction) * 100)
        round = (actualQuantityProduction / totalPlanQuantityProduction)
        let performances = {
          totalPlanQuantityProduction,
          actualQuantityProduction,
          totalProduction,
          upTime,
          performance,
          roundPercentage,
          round
        }
        
        totalProduction = qtyActual;
        let totalProductOk = qtyActual - qtyReject
        roundPercentage = Math.round((totalProductOk / totalProduction) * 100);
        round = (totalProductOk / totalProduction);
        if (isNaN(roundPercentage) || isNaN(round)) {
          roundPercentage = 0;
          round = 0;
        }
        let quality = {
          totalProduction,
          totalProductOk,
          roundPercentage,
          round
        }

        let oee = Math.round((availability['round'] * performances['round'] * quality['round']) * 100)
        return {
          dateTimeIn, dateTimeOut, timeInMinute, qtyPlanning, qtyActual, qtyReject, lineStopOther, availability, performances, quality, oee
        }
      })
    )
    
      const initialValue = {
        availability: { plannedProduction: 0, actualProduction: 0, roundPercentage: 0, round: 0 },
        performances: {
          totalPlanQuantityProduction: 0,
          actualQuantityProduction: 0,
          totalProduction: 0,
          upTime: 0,
          performances: 0.0,
          roundPercentage: 0.0,
          round: 0,
        },
        quality: { totalProduction: 0, totalProductOk: 0, roundPercentage: 0, round: 0 },
        oee: 0.0,
      };
      
      const reduceMap = planningMapping.reduce((total, prefix) => {
        total.availability.plannedProduction += Number(prefix.availability.plannedProduction);
        total.availability.actualProduction += Number(prefix.availability.actualProduction);
        total.availability.roundPercentage += Number(prefix.availability.roundPercentage);
        total.availability.round += Number(prefix.availability.round);
        total.performances.totalPlanQuantityProduction += Number(prefix.performances.totalPlanQuantityProduction);
        total.performances.actualQuantityProduction += Number(prefix.performances.actualQuantityProduction);
        total.performances.totalProduction += Number(prefix.performances.totalProduction);
        total.performances.upTime += Number(prefix.performances.upTime);
        total.performances.performances += Number(prefix.performances.performance);
        total.performances.roundPercentage += Number(prefix.performances.roundPercentage);
        total.performances.round += Number(prefix.performances.round);
        total.quality.totalProduction += Number(prefix.quality.totalProduction);
        total.quality.totalProductOk += Number(prefix.quality.totalProductOk);
        total.quality.roundPercentage += Number(prefix.quality.roundPercentage);
        total.quality.round += Number(prefix.quality.round);
        total.oee += Number(prefix.oee);
        return total;
      }, initialValue);
      
      let round_ava;
      let round_per;
      let round_qua;
      let oee;
        
      round_ava = reduceMap['availability']['actualProduction'] / reduceMap['availability']['plannedProduction'];
      round_per = reduceMap['performances']['actualQuantityProduction'] / reduceMap['performances']['totalPlanQuantityProduction'];
      if (isNaN(round_ava) || isNaN(round_per)) {
        round_ava = reduceMap['availability']['actualProduction'] / reduceMap['availability']['plannedProduction'];
        round_per = reduceMap['performances']['actualQuantityProduction'] / reduceMap['performances']['totalPlanQuantityProduction'];
      }

      round_qua = reduceMap['quality']['totalProductOk'] / reduceMap['quality']['totalProduction'];
      if (isNaN(round_qua)) {
        round_qua = 0;
      }

      oee = Number(((round_ava) * (round_per) * (round_qua) * 100).toFixed(1));
      if (isNaN(oee)) {
        oee = 0;
      }
      return oee
  }

  
  async oneYearAgo(client_id) {
    const startDateOneYearAgo = moment().subtract(1, 'year').startOf('year');
    const endDateOneYearAgo = moment().subtract(1, 'year').endOf('year');

    const planMap = await this.planningProductionReportRepository.createQueryBuilder('planningProductionReport')
    .leftJoinAndSelect('planningProductionReport.productionReportLineStop', 'productionReportLineStop')
    .where('planningProductionReport.client_id = :client_id', {client_id: client_id})
    .andWhere(`planningProductionReport.planning_date_time_in BETWEEN :startDateOneYearAgo AND :endDateOneYearAgo`, {
      startDateOneYearAgo, endDateOneYearAgo
    })
    .getMany()

    const planningMapping = await Promise.all(planMap.map(async (productionReport) => {
        let dateTimeIn = productionReport.planning_date_time_in;
        let dateTimeOut = productionReport.planning_date_time_out;
        let timeInMinute = moment(dateTimeOut).diff(moment(dateTimeIn), 'minute');
        let qtyPlanning = productionReport.qty_planning;
        let qtyActual = productionReport.production_qty_actual ?? 0;
        let qtyReject = (await this.planningProductionService.getQtyReject(client_id, dateTimeIn, dateTimeOut))?.qty_reject ?? 0;
        let lineStopOther = productionReport.productionReportLineStop.reduce((total, value) => total + value.timeTotal, 0) ?? 0
        
        let plannedProduction = timeInMinute;
        let actualProduction = timeInMinute - lineStopOther;
        let roundPercentage = Math.round((actualProduction / plannedProduction) * 100);
        let round = (actualProduction / plannedProduction);
        let availability = {plannedProduction, actualProduction, roundPercentage, round}
        
        let totalPlanQuantityProduction = qtyPlanning;
        let actualQuantityProduction = qtyActual;
        let totalProduction = qtyActual;
        let upTime = timeInMinute - lineStopOther;
        let performance = Math.round(totalProduction / upTime);
        roundPercentage = Math.round((actualQuantityProduction / totalPlanQuantityProduction) * 100)
        round = (actualQuantityProduction / totalPlanQuantityProduction)
        let performances = {
          totalPlanQuantityProduction,
          actualQuantityProduction,
          totalProduction,
          upTime,
          performance,
          roundPercentage,
          round
        }
        
        totalProduction = qtyActual;
        let totalProductOk = qtyActual - qtyReject
        roundPercentage = Math.round((totalProductOk / totalProduction) * 100);
        round = (totalProductOk / totalProduction);
        if (isNaN(roundPercentage) || isNaN(round)) {
          roundPercentage = 0;
          round = 0;
        }
        let quality = {
          totalProduction,
          totalProductOk,
          roundPercentage,
          round
        }

        let oee = Math.round((availability['round'] * performances['round'] * quality['round']) * 100)
        return {
          dateTimeIn, dateTimeOut, timeInMinute, qtyPlanning, qtyActual, qtyReject, lineStopOther, availability, performances, quality, oee
        }
      })
    )
    
      const initialValue = {
        availability: { plannedProduction: 0, actualProduction: 0, roundPercentage: 0, round: 0 },
        performances: {
          totalPlanQuantityProduction: 0,
          actualQuantityProduction: 0,
          totalProduction: 0,
          upTime: 0,
          performances: 0.0,
          roundPercentage: 0.0,
          round: 0,
        },
        quality: { totalProduction: 0, totalProductOk: 0, roundPercentage: 0, round: 0 },
        oee: 0.0,
      };
      
      const reduceMap = planningMapping.reduce((total, prefix) => {
        total.availability.plannedProduction += Number(prefix.availability.plannedProduction);
        total.availability.actualProduction += Number(prefix.availability.actualProduction);
        total.availability.roundPercentage += Number(prefix.availability.roundPercentage);
        total.availability.round += Number(prefix.availability.round);
        total.performances.totalPlanQuantityProduction += Number(prefix.performances.totalPlanQuantityProduction);
        total.performances.actualQuantityProduction += Number(prefix.performances.actualQuantityProduction);
        total.performances.totalProduction += Number(prefix.performances.totalProduction);
        total.performances.upTime += Number(prefix.performances.upTime);
        total.performances.performances += Number(prefix.performances.performance);
        total.performances.roundPercentage += Number(prefix.performances.roundPercentage);
        total.performances.round += Number(prefix.performances.round);
        total.quality.totalProduction += Number(prefix.quality.totalProduction);
        total.quality.totalProductOk += Number(prefix.quality.totalProductOk);
        total.quality.roundPercentage += Number(prefix.quality.roundPercentage);
        total.quality.round += Number(prefix.quality.round);
        total.oee += Number(prefix.oee);
        return total;
      }, initialValue);
      
      let round_ava;
      let round_per;
      let round_qua;
      let oee;
        
      round_ava = reduceMap['availability']['actualProduction'] / reduceMap['availability']['plannedProduction'];
      round_per = reduceMap['performances']['actualQuantityProduction'] / reduceMap['performances']['totalPlanQuantityProduction'];
      if (isNaN(round_ava) || isNaN(round_per)) {
        round_ava = reduceMap['availability']['actualProduction'] / reduceMap['availability']['plannedProduction'];
        round_per = reduceMap['performances']['actualQuantityProduction'] / reduceMap['performances']['totalPlanQuantityProduction'];
      }

      round_qua = reduceMap['quality']['totalProductOk'] / reduceMap['quality']['totalProduction'];
      if (isNaN(round_qua)) {
        round_qua = 0;
      }

      oee = Number(((round_ava) * (round_per) * (round_qua) * 100).toFixed(1));
      if (isNaN(oee)) {
        oee = 0;
      }
      return oee
  }
  
  async twoYearAgo(client_id) {
    const startDateTwoYearAgo = moment().subtract(2, 'year').startOf('year');
    const endDateTwoYearAgo = moment().subtract(2, 'year').endOf('year');

    const planMap = await this.planningProductionReportRepository.createQueryBuilder('planningProductionReport')
    .leftJoinAndSelect('planningProductionReport.productionReportLineStop', 'productionReportLineStop')
    .where('planningProductionReport.client_id = :client_id', {client_id: client_id})
    .andWhere(`planningProductionReport.planning_date_time_in BETWEEN :startDateTwoYearAgo AND :endDateTwoYearAgo`, {
      startDateTwoYearAgo, endDateTwoYearAgo
    })
    .getMany()

    const planningMapping = await Promise.all(planMap.map(async (productionReport) => {
        let dateTimeIn = productionReport.planning_date_time_in;
        let dateTimeOut = productionReport.planning_date_time_out;
        let timeInMinute = moment(dateTimeOut).diff(moment(dateTimeIn), 'minute');
        let qtyPlanning = productionReport.qty_planning;
        let qtyActual = productionReport.production_qty_actual ?? 0;
        let qtyReject = (await this.planningProductionService.getQtyReject(client_id, dateTimeIn, dateTimeOut))?.qty_reject ?? 0;
        let lineStopOther = productionReport.productionReportLineStop.reduce((total, value) => total + value.timeTotal, 0) ?? 0
        
        let plannedProduction = timeInMinute;
        let actualProduction = timeInMinute - lineStopOther;
        let roundPercentage = Math.round((actualProduction / plannedProduction) * 100);
        let round = (actualProduction / plannedProduction);
        let availability = {plannedProduction, actualProduction, roundPercentage, round}
        
        let totalPlanQuantityProduction = qtyPlanning;
        let actualQuantityProduction = qtyActual;
        let totalProduction = qtyActual;
        let upTime = timeInMinute - lineStopOther;
        let performance = Math.round(totalProduction / upTime);
        roundPercentage = Math.round((actualQuantityProduction / totalPlanQuantityProduction) * 100)
        round = (actualQuantityProduction / totalPlanQuantityProduction)
        let performances = {
          totalPlanQuantityProduction,
          actualQuantityProduction,
          totalProduction,
          upTime,
          performance,
          roundPercentage,
          round
        }
        
        totalProduction = qtyActual;
        let totalProductOk = qtyActual - qtyReject
        roundPercentage = Math.round((totalProductOk / totalProduction) * 100);
        round = (totalProductOk / totalProduction);
        if (isNaN(roundPercentage) || isNaN(round)) {
          roundPercentage = 0;
          round = 0;
        }
        let quality = {
          totalProduction,
          totalProductOk,
          roundPercentage,
          round
        }

        let oee = Math.round((availability['round'] * performances['round'] * quality['round']) * 100)
        return {
          dateTimeIn, dateTimeOut, timeInMinute, qtyPlanning, qtyActual, qtyReject, lineStopOther, availability, performances, quality, oee
        }
      })
    )
    
      const initialValue = {
        availability: { plannedProduction: 0, actualProduction: 0, roundPercentage: 0, round: 0 },
        performances: {
          totalPlanQuantityProduction: 0,
          actualQuantityProduction: 0,
          totalProduction: 0,
          upTime: 0,
          performances: 0.0,
          roundPercentage: 0.0,
          round: 0,
        },
        quality: { totalProduction: 0, totalProductOk: 0, roundPercentage: 0, round: 0 },
        oee: 0.0,
      };
      
      const reduceMap = planningMapping.reduce((total, prefix) => {
        total.availability.plannedProduction += Number(prefix.availability.plannedProduction);
        total.availability.actualProduction += Number(prefix.availability.actualProduction);
        total.availability.roundPercentage += Number(prefix.availability.roundPercentage);
        total.availability.round += Number(prefix.availability.round);
        total.performances.totalPlanQuantityProduction += Number(prefix.performances.totalPlanQuantityProduction);
        total.performances.actualQuantityProduction += Number(prefix.performances.actualQuantityProduction);
        total.performances.totalProduction += Number(prefix.performances.totalProduction);
        total.performances.upTime += Number(prefix.performances.upTime);
        total.performances.performances += Number(prefix.performances.performance);
        total.performances.roundPercentage += Number(prefix.performances.roundPercentage);
        total.performances.round += Number(prefix.performances.round);
        total.quality.totalProduction += Number(prefix.quality.totalProduction);
        total.quality.totalProductOk += Number(prefix.quality.totalProductOk);
        total.quality.roundPercentage += Number(prefix.quality.roundPercentage);
        total.quality.round += Number(prefix.quality.round);
        total.oee += Number(prefix.oee);
        return total;
      }, initialValue);
      
      let round_ava;
      let round_per;
      let round_qua;
      let oee;
        
      round_ava = reduceMap['availability']['actualProduction'] / reduceMap['availability']['plannedProduction'];
      round_per = reduceMap['performances']['actualQuantityProduction'] / reduceMap['performances']['totalPlanQuantityProduction'];
      if (isNaN(round_ava) || isNaN(round_per)) {
        round_ava = reduceMap['availability']['actualProduction'] / reduceMap['availability']['plannedProduction'];
        round_per = reduceMap['performances']['actualQuantityProduction'] / reduceMap['performances']['totalPlanQuantityProduction'];
      }

      round_qua = reduceMap['quality']['totalProductOk'] / reduceMap['quality']['totalProduction'];
      if (isNaN(round_qua)) {
        round_qua = 0;
      }

      oee = Number(((round_ava) * (round_per) * (round_qua) * 100).toFixed(1));
      if (isNaN(oee)) {
        oee = 0;
      }
      return oee
  }

  async monthly(client_id) {
    const startMonth = moment().startOf('year').format('YYYY-MM');
    const endMonth = moment().subtract(1, 'month').startOf('month').format('YYYY-MM');

    const rangeMonth = this.range(0, moment(endMonth).diff(moment(startMonth), 'month'))
    const monthly = await Promise.all(rangeMonth.map(async value => {
      let date = moment(startMonth, 'YYYY-MM-DD')
      let startDate = moment(date).add(value, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss');
      let endDate = moment(date).add(value, 'month').endOf('month').format('YYYY-MM-DD HH:mm:ss');
  
      const planMap = await this.planningProductionReportRepository.createQueryBuilder('planningProductionReport')
      .leftJoinAndSelect('planningProductionReport.productionReportLineStop', 'productionReportLineStop')
      .where('planningProductionReport.client_id = :client_id', {client_id: client_id})
      .andWhere(`planningProductionReport.planning_date_time_in BETWEEN :startDate AND :endDate`, {
        startDate, endDate
      })
      .getMany()

        const planningMapping = await Promise.all(planMap.map(async (productionReport) => {
          let dateTimeIn = productionReport.planning_date_time_in;
          let dateTimeOut = productionReport.planning_date_time_out;
          let timeInMinute = moment(dateTimeOut).diff(moment(dateTimeIn), 'minute');
          let qtyPlanning = productionReport.qty_planning;
          let qtyActual = productionReport.production_qty_actual ?? 0;
          let qtyReject = (await this.planningProductionService.getQtyReject(client_id, dateTimeIn, dateTimeOut))?.qty_reject ?? 0;
          let lineStopOther = productionReport.productionReportLineStop.reduce((total, value) => total + value.timeTotal, 0) ?? 0
          
          let plannedProduction = timeInMinute;
          let actualProduction = timeInMinute - lineStopOther;
          let roundPercentage = Math.round((actualProduction / plannedProduction) * 100);
          let round = (actualProduction / plannedProduction);
          let availability = {plannedProduction, actualProduction, roundPercentage, round}
          if (isNaN(round) || isNaN(roundPercentage)) {
            round = 0
          }

          let totalPlanQuantityProduction = qtyPlanning;
          let actualQuantityProduction = qtyActual;
          let totalProduction = qtyActual;
          let upTime = timeInMinute - lineStopOther;
          let performance = Math.round(totalProduction / upTime);
          roundPercentage = Math.round((actualQuantityProduction / totalPlanQuantityProduction) * 100)
          round = (actualQuantityProduction / totalPlanQuantityProduction)
          let performancePercentage = Math.round((productionReport.product_cycle_time * productionReport.production_qty_actual / 60) / timeInMinute * 100)
          let performances = {
            totalPlanQuantityProduction,
            actualQuantityProduction,
            totalProduction,
            upTime,
            performance,
            roundPercentage,
            round,
            performancePercentage
          }
          
          totalProduction = qtyActual;
          let totalProductOk = qtyActual - qtyReject
          roundPercentage = Math.round((totalProductOk / totalProduction) * 100);
          round = (totalProductOk / totalProduction);
          if (isNaN(roundPercentage) || isNaN(round)) {
            roundPercentage = 0;
            round = 0;
          }
  
          let qualityPercentage = Math.round(productionReport.production_qty_actual / (productionReport.production_qty_actual - 0) * 100)
          let quality = {
            totalProduction,
            totalProductOk,
            roundPercentage,
            round,
            qualityPercentage
          }

          let oee = Math.round((availability['round'] * performances['round'] * quality['round']) * 100)
          return {
            dateTimeIn, dateTimeOut, timeInMinute, qtyPlanning, qtyActual, qtyReject, lineStopOther, availability, performances, quality, oee
          }
        })
      )
      
      const initialValue = {
        availability: { plannedProduction: 0, actualProduction: 0, roundPercentage: 0, round: 0 },
        performances: {
          totalPlanQuantityProduction: 0,
          actualQuantityProduction: 0,
          totalProduction: 0,
          upTime: 0,
          performances: 0.0,
          roundPercentage: 0.0,
          round: 0,
          performancePercentage: 0
        },
        quality: { totalProduction: 0, totalProductOk: 0, roundPercentage: 0, round: 0, qualityPercentage: 0 },
        oee: 0.0,
      };
      
      const reduceMap = planningMapping.reduce((total, prefix) => {
        total.availability.plannedProduction += Number(prefix.availability.plannedProduction);
        total.availability.actualProduction += Number(prefix.availability.actualProduction);
        total.availability.roundPercentage += Number(prefix.availability.roundPercentage);
        total.availability.round += Number(prefix.availability.round);
        total.performances.totalPlanQuantityProduction += Number(prefix.performances.totalPlanQuantityProduction);
        total.performances.actualQuantityProduction += Number(prefix.performances.actualQuantityProduction);
        total.performances.totalProduction += Number(prefix.performances.totalProduction);
        total.performances.upTime += Number(prefix.performances.upTime);
        total.performances.performances += Number(prefix.performances.performance);
        total.performances.roundPercentage += Number(prefix.performances.roundPercentage);
        total.performances.round += Number(prefix.performances.round);
        total.performances.performancePercentage += Number(prefix.performances.performancePercentage);
        total.quality.totalProduction += Number(prefix.quality.totalProduction);
        total.quality.totalProductOk += Number(prefix.quality.totalProductOk);
        total.quality.roundPercentage += Number(prefix.quality.roundPercentage);
        total.quality.round += Number(prefix.quality.round);
        total.quality.qualityPercentage += Number(prefix.quality.qualityPercentage);
        total.oee += Number(prefix.oee)
        return total;
      }, initialValue);
      
      let round_ava;
      let round_per;
      let round_qua;
      let oee;
        
      round_ava = reduceMap['availability']['actualProduction'] / reduceMap['availability']['plannedProduction'];
      round_per = reduceMap['performances']['actualQuantityProduction'] / reduceMap['performances']['totalPlanQuantityProduction'];
      if (isNaN(round_ava) || isNaN(round_per)) {
        round_ava = reduceMap['availability']['actualProduction'] / reduceMap['availability']['plannedProduction'];
        round_per = reduceMap['performances']['actualQuantityProduction'] / reduceMap['performances']['totalPlanQuantityProduction'];
      }

      round_qua = reduceMap['quality']['totalProductOk'] / reduceMap['quality']['totalProduction'];
      if (isNaN(round_qua)) {
        round_qua = 0;
      }

      oee = Number(((round_ava) * (round_per) * (round_qua) * 100).toFixed(1));
      if (isNaN(oee)) {
        oee = 0;
      }

      const availabilityPercentage = reduceMap['availability']['roundPercentage']
      const performancePercentage = reduceMap['performances']['performancePercentage']
      const qualityPercentage = reduceMap['quality']['qualityPercentage']

      return {
        label: moment(date).add(value, 'month').format('MMM-YY'),
        value: {oee, availabilityPercentage, performancePercentage, qualityPercentage},
        color: 'orange'
      }
    }))

    const startDay = moment().startOf('month').format('YYYY-MM-DD');
    const endDay = moment().endOf('month').format('YYYY-MM-DD');
    
    const rangeDay = this.range(0, moment(endDay).diff(moment(startDay), 'day'))

    const daily = await Promise.all(rangeDay.map(async value => {
      const date = moment(startDay).format('YYYY-MM-DD');
      const startDate = moment(date).add(value, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss');
      const endDate = moment(date).add(value, 'day').endOf('day').format('YYYY-MM-DD HH:mm:ss');
      
      const planMap = await this.planningProductionReportRepository.createQueryBuilder('planningProductionReport')
      .leftJoinAndSelect('planningProductionReport.productionReportLineStop', 'productionReportLineStop')
      .where('planningProductionReport.client_id = :client_id', {client_id: client_id})
      .andWhere(`planningProductionReport.planning_date_time_in BETWEEN :startDate AND :endDate`, {
        startDate, endDate
      })
      .getMany()
      
      const planningMapping = await Promise.all(planMap.map(async (productionReport) => {
        let dateTimeIn = productionReport.planning_date_time_in;
        let dateTimeOut = productionReport.planning_date_time_out;
        let timeInMinute = moment(dateTimeOut).diff(moment(dateTimeIn), 'minute');
        let qtyPlanning = productionReport.qty_planning;
        let qtyActual = productionReport.production_qty_actual ?? 0;
        let qtyReject = (await this.planningProductionService.getQtyReject(client_id, dateTimeIn, dateTimeOut))?.qty_reject ?? 0;
        let lineStopOther = productionReport.productionReportLineStop.reduce((total, value) => total + value.timeTotal, 0) ?? 0
        
        let plannedProduction = timeInMinute;
        let actualProduction = timeInMinute - lineStopOther;
        let roundPercentage = Math.round((actualProduction / plannedProduction) * 100);
        let round = (actualProduction / plannedProduction);
        let availability = {plannedProduction, actualProduction, roundPercentage, round}
        if (isNaN(round) || isNaN(roundPercentage)) {
          round = 0
        }
        let totalPlanQuantityProduction = qtyPlanning;
        let actualQuantityProduction = qtyActual;
        let totalProduction = qtyActual;
        let upTime = timeInMinute - lineStopOther;
        let performance = Math.round(totalProduction / upTime);
        roundPercentage = Math.round((actualQuantityProduction / totalPlanQuantityProduction) * 100)
        round = (actualQuantityProduction / totalPlanQuantityProduction)
        let performancePercentage = Math.round((productionReport.product_cycle_time * productionReport.production_qty_actual / 60) / timeInMinute * 100)
        let performances = {
          totalPlanQuantityProduction,
          actualQuantityProduction,
          totalProduction,
          upTime,
          performance,
          roundPercentage,
          round,
          performancePercentage
        }
        
        totalProduction = qtyActual;
        let totalProductOk = qtyActual - qtyReject
        roundPercentage = Math.round((totalProductOk / totalProduction) * 100);
        round = (totalProductOk / totalProduction);
        if (isNaN(roundPercentage) || isNaN(round)) {
          roundPercentage = 0;
          round = 0;
        }
        
        let qualityPercentage = Math.round(productionReport.production_qty_actual / (productionReport.production_qty_actual - 0) * 100)
        let quality = {
          totalProduction,
          totalProductOk,
          roundPercentage,
          round,
          qualityPercentage
        }

        let oee = Math.round((availability['round'] * performances['round'] * quality['round']) * 100)
        return {
          dateTimeIn, dateTimeOut, timeInMinute, qtyPlanning, qtyActual, qtyReject, lineStopOther, availability, performances, quality, oee
        }
      }))
      
      const initialValue = {
        availability: { plannedProduction: 0, actualProduction: 0, roundPercentage: 0, round: 0 },
        performances: {
          totalPlanQuantityProduction: 0,
          actualQuantityProduction: 0,
          totalProduction: 0,
          upTime: 0,
          performances: 0.0,
          roundPercentage: 0.0,
          round: 0,
          performancePercentage: 0
        },
        quality: { totalProduction: 0, totalProductOk: 0, roundPercentage: 0, round: 0, qualityPercentage: 0 },
        oee: 0.0,
      };
      
      const reduceMap = planningMapping.reduce((total, prefix) => {
        total.availability.plannedProduction += Number(prefix.availability.plannedProduction);
        total.availability.actualProduction += Number(prefix.availability.actualProduction);
        total.availability.roundPercentage += Number(prefix.availability.roundPercentage);
        total.availability.round += Number(prefix.availability.round);
        total.performances.totalPlanQuantityProduction += Number(prefix.performances.totalPlanQuantityProduction);
        total.performances.actualQuantityProduction += Number(prefix.performances.actualQuantityProduction);
        total.performances.totalProduction += Number(prefix.performances.totalProduction);
        total.performances.upTime += Number(prefix.performances.upTime);
        total.performances.performances += Number(prefix.performances.performance);
        total.performances.roundPercentage += Number(prefix.performances.roundPercentage);
        total.performances.round += Number(prefix.performances.round);
        total.quality.totalProduction += Number(prefix.quality.totalProduction);        
        total.performances.performancePercentage += Number(prefix.performances.performancePercentage);
        total.quality.totalProductOk += Number(prefix.quality.totalProductOk);
        total.quality.roundPercentage += Number(prefix.quality.roundPercentage);
        total.quality.round += Number(prefix.quality.round);
        total.quality.qualityPercentage += Number(prefix.quality.qualityPercentage);
        total.oee += Number(prefix.oee);
        return total;
      }, initialValue);
    
      let round_ava;
      let round_per;
      let round_qua;
      let oee;
      
      round_ava = reduceMap['availability']['actualProduction'] / reduceMap['availability']['plannedProduction'];
      round_per = reduceMap['performances']['actualQuantityProduction'] / reduceMap['performances']['totalPlanQuantityProduction'];
      if (isNaN(round_ava) || isNaN(round_per)) {
        round_ava = reduceMap['availability']['actualProduction'] / reduceMap['availability']['plannedProduction'];
        round_per = reduceMap['performances']['actualQuantityProduction'] / reduceMap['performances']['totalPlanQuantityProduction'];
      }

      round_qua = reduceMap['quality']['totalProductOk'] / reduceMap['quality']['totalProduction'];
      if (isNaN(round_qua)) {
        round_qua = 0;
      }

      oee = Number(((round_ava) * (round_per) * (round_qua) * 100).toFixed(1));
      if (isNaN(oee)) {
        oee = 0;
      }

      const availabilityPercentage = reduceMap['availability']['roundPercentage']
      const performancePercentage = reduceMap['performances']['performancePercentage']
      const qualityPercentage = reduceMap['quality']['qualityPercentage']

      return {
        label: moment(date).add(value, 'day').locale('id').format('DD dddd'),
        value: {oee, availabilityPercentage, performancePercentage, qualityPercentage},
        color: 'green'
      }
    }))

    return [...monthly, ...daily]
  }

  async getDataReport(clientId) {
    const startDay = moment().startOf('month').format('YYYY-MM-DD');
    const endDay = moment().endOf('month').format('YYYY-MM-DD');
    
    const rangeDay = this.range(0, moment(endDay).diff(moment(startDay), 'day'))

    const data = await (await Promise.all(rangeDay.map(async (value) => {
      const date = moment(startDay).format('YYYY-MM-DD');
      const startDate = moment(date).add(value, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss');
      const endDate = moment(date).add(value, 'day').endOf('day').format('YYYY-MM-DD HH:mm:ss');

      const planMap = await this.planningProductionReportRepository.createQueryBuilder('planningProductionReport')
        .leftJoinAndSelect('planningProductionReport.productionReportLineStop', 'productionReportLineStop')
        .where('planningProductionReport.client_id = :client_id', { client_id: clientId })
        .andWhere(`planningProductionReport.planning_date_time_in BETWEEN :startDate AND :endDate`, {
          startDate, endDate
        })
        .getMany();

      const planMapping =await Promise.all(planMap.map(async (productionReport, key) => {
        const startPlan = moment(productionReport.planning_date_time_in).format('YYYY-MM-DD HH:mm:ss');
        const endPlan = moment(productionReport.planning_date_time_out).format('YYYY-MM-DD HH:mm:ss');
        const endPlanTarget = moment(startPlan).add(productionReport.planning_total, 'minute').format('YYYY-MM-DD HH:mm:ss');

        let date = moment(startDate).format('YYYY-MM-DD')
        const normalWorkingTime = moment(endPlanTarget).diff(moment(startPlan), 'minute');
        const overTime = moment(endPlan).diff(moment(startPlan), 'minute');
        const qtyActual = planMap.reduce((total, value) => total + Number(value.production_qty_actual),0)

        const noPlanNormal = (await this.noPlanMachineService.findNoPlanByRange(clientId, startPlan, endPlanTarget))?.reduce((total, value) => (total + value.total), 0)
        const noPlanOT = (await this.noPlanMachineService.findNoPlanByRange(clientId, startPlan, endPlan))?.reduce((total, value) => (total + value.total), 0)
        
        const downTime = productionReport.productionReportLineStop
        
        return { date, overTime, normalWorkingTime, qtyActual, noPlanNormal, noPlanOT, downTime };
      }));
      const plan = planMapping[0];
      return { plan };
    }))).map((item, key) => {
      if (item.plan) {
        return item.plan
      } else {
        let date = moment(startDay).add(key, 'day').format('YYYY-MM-DD')
        const normalWorkingTime = null;
        const overTime = null;
        const qtyActual = null
        const noPlanNormal = null
        const noPlanOT = null
        return { date, overTime, normalWorkingTime, qtyActual, noPlanNormal, noPlanOT };
      }
    })
    // console.log(data);
    
    return data
  }
  
  range(start: number, end: number): number[] {
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }
}
