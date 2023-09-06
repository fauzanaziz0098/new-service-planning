import { PlanningProductionReport } from 'src/planning-production-report/entities/planning-production-report.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('production_report_line_stops')
export class ProductionReportLineStop {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'line_stop_name' })
  lineStopName: string;

  @Column({ name: 'time_total' })
  timeTotal: number;

  @ManyToOne(
    () => PlanningProductionReport,
    (planningProductionReport) =>
      planningProductionReport.productionReportLineStop,
    {
      eager: true,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'planning_production_report_id' })
  planningProductionReport: PlanningProductionReport | null;
}
