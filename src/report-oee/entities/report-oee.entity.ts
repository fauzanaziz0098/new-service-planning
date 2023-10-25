import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('report_oee')
export class ReportOee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, name: 'shift_start' })
  shfitStart: string;

  @Column({ nullable: true, name: 'shift_end' })
  shiftEnd: string;

  @Column()
  client: string;

  @Column()
  machine: string;

  @Column('numeric')
  lineStopTotal: number;

  @Column('numeric')
  oee: number;

  @Column('numeric')
  planning: number;

  @Column('numeric', { name: 'avaibility_planned_production' })
  avaibilityPlannedProduction: number;
  @Column('numeric', { name: 'avaibility_actual_production' })
  avaibilityActualProduction: number;
  @Column('numeric', { name: 'avaibility_round_percentage' })
  avaibilityRoundPercentage: number;

  @Column('numeric', { name: 'quality_total_production' })
  qualityTotalProduction: number;
  @Column('numeric', { name: 'quality_total_product_ok' })
  qualityTotalProductOk: number;
  @Column('numeric', { name: 'quality_round_percentage' })
  qualityRoundPercentage: number;

  @Column('numeric', { name: 'perfomance_total_plan_quantity_production' })
  perfomanceTotalPlanQuantityProduction: number;
  @Column('numeric', { name: 'perfomance_actual_quantity_production' })
  perfomanceActualQuantityProduction: number;
  @Column('numeric', { name: 'perfomance_total_production' })
  perfomanceTotalProduction: number;
  @Column('numeric', { name: 'perfomance_up_time' })
  perfomanceUpTime: number;
  @Column('numeric', { name: 'perfomance_perfomance' })
  perfomancePerfomance: number;
  @Column('numeric', { name: 'perfomance_round_percentage' })
  perfomanceRoundPercentage: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
