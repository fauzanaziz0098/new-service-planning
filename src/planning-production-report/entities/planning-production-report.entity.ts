import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PlanningProductionReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: string;

  @Column({ nullable: true, type: 'time' })
  time_start: Date;

  @Column({ nullable: true, type: 'time' })
  time_end: Date;

  @Column()
  product_part_name: string;

  @Column()
  product_part_number: string;

  @Column()
  shift: string;

  @Column()
  product_cycle_time: number;

  @Column()
  machine_name: string;

  @Column()
  qty_planning: number;

  @Column({ type: 'timestamp without time zone', nullable: true })
  planning_date_time_in: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  planning_date_time_out: Date;

  @Column({ nullable: true })
  planning_total: number;

  @Column({ nullable: true })
  production_qty_actual: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
