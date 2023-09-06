import { PlanningProduction } from 'src/planning-production/entities/planning-production.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class NoPlanMachineAdditional {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: string;

  @ManyToOne(
    () => PlanningProduction,
    (planningProduction) => planningProduction.no_plan_machine_additional,
  )
  @JoinColumn({ name: 'planning_production_id' })
  planning_production: PlanningProduction;

  @Column({ type: 'time' })
  time_in: Date;

  @Column({ type: 'time' })
  time_out: Date;

  @Column({ default: 0 })
  total: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
