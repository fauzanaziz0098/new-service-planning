import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('report_shifts')
export class ReportShift {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_part_name: string;

  @Column()
  product_part_number: string;

  @Column()
  product_cycle_time: number;

  @Column()
  machine_name: string;

  @Column()
  oprator_name: string;

  @Column()
  shift: string;

  @Column()
  no_plan: number;

  @Column()
  qty_plan: number;

  @Column()
  qty_actual: number;

  @Column()
  planning_id: number;

  @Column()
  total_planning: number;

  @Column()
  client_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
