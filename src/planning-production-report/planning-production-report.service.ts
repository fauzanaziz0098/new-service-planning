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

@Injectable()
export class PlanningProductionReportService {
  constructor(
    @InjectRepository(PlanningProductionReport)
    private readonly planningProductionReportRepository: Repository<PlanningProductionReport>,
    @Inject(forwardRef(() => ProductionReportLineStopService))
    private readonly productionReportLineStopService: ProductionReportLineStopService,
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
    // client_id: activePlan.client_id,
    //   // SHIFT
    //   shift: activePlan.shift.name,
    //   time_start: activePlan.shift.time_start,
    //   time_end: activePlan.shift.time_end,
    //   // product
    //   product_part_name: activePlan.product.part_name,
    //   product_part_number: activePlan.product.part_number,
    //   product_cycle_time: activePlan.product.cycle_time,
    //   // MCHINE
    //   machine_name: activePlan.machine.name,
    //   machine_number: activePlan.machine.number,
    //   // PLANNING
    //   qty_planning: activePlan.qty_planning,
    //   planning_date_time_in: activePlan.date_time_in,
    //   planning_date_time_out: activePlanDateTimeOut,
    //   planning_total: activePlan.total_time_planning,
    // if after save buat line stop report

    const { data } = (
      await axios.get(
        `${process.env.SERVICE_LOSS_TIME}/loss-time/line-stops?dateIn=${createPlanningProductionReportDto.planning.date_time_in}&dateEnd=${createPlanningProductionReportDto.planning.date_time_out}`,
        {
          headers: {
            Authorization: token,
          },
        },
      )
    ).data;
  }
}
