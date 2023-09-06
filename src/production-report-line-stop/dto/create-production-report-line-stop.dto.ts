import { PlanningProductionReport } from 'src/planning-production-report/entities/planning-production-report.entity';

export class CreateProductionReportLineStopDto {
  planningProductionReport: PlanningProductionReport;
  lineStopName: string;
  timeTotal: number;
}
