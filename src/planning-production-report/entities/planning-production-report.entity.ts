import { ProductionReportLineStop } from 'src/production-report-line-stop/entities/production-report-line-stop.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity()
export class PlanningProductionReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: string;

  @Column({ nullable: true })
  shift_start: string;

  @Column({ nullable: true })
  shift_end: string;

  @Column()
  product_part_name: string;

  @Column()
  oprator: string;

  @Column()
  product_part_number: string;

  // @Column()
  // shift: string;

  @Column('numeric', {nullable: true})
  product_cycle_time: number;

  @Column()
  machine_name: string;

  @Column('numeric', {nullable: true})
  qty_planning: number;

  @Column({ type: 'timestamp without time zone', nullable: true })
  planning_date_time_in: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  planning_date_time_out: Date;

  @Column('numeric', { nullable: true })
  planning_total: number;

  @OneToMany(
    () => ProductionReportLineStop,
    (productionReportLineStop) =>
      productionReportLineStop.planningProductionReport,
  )
  productionReportLineStop: ProductionReportLineStop[];

  @Column('numeric', { nullable: true })
  production_qty_actual: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
