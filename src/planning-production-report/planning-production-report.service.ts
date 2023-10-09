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

@Injectable()
export class PlanningProductionReportService {
  constructor(
    @InjectRepository(PlanningProductionReport)
    private readonly planningProductionReportRepository: Repository<PlanningProductionReport>,
    @Inject(forwardRef(() => ProductionReportLineStopService))
    private readonly productionReportLineStopService: ProductionReportLineStopService,
    @Inject(forwardRef(() => ShiftService))
    private readonly shiftService: ShiftService,
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
        `${process.env.SERVICE_PER_JAM}/production/last-production${createPlanningProductionReportDto.planning.id}`,
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
        `${process.env.SERVICE_LOSS_TIME}/loss-time/line-stops`,
        {
          dateIn: createPlanningProductionReportDto.planning.date_time_in,
          dateEnd: createPlanningProductionReportDto.planning.date_time_out,
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
}
