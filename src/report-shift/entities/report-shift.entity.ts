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

  @Column('numeric')
  product_cycle_time: number;

  @Column()
  machine_name: string;

  @Column()
  oprator_name: string;

  @Column()
  shift: string;

  @Column('numeric', { nullable: true })
  no_plan: number;

  @Column('numeric', { nullable: true })
  qty_plan: number;

  @Column('numeric')
  qty_actual: number;

  @Column('numeric')
  planning_id: number;

  @Column('numeric')
  total_planning: number;

  @Column()
  client_id: string;

  @Column('numeric', {nullable: true})
  availability: number

  @Column('numeric', {nullable: true})
  performance: number

  @Column('numeric', {nullable: true})
  quality: number

  @Column('numeric', {nullable: true})
  oee: number

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
