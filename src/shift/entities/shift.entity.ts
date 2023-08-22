import { NoPlanMachine } from 'src/no-plan-machine/entities/no-plan-machine.entity';
import { PlanningProduction } from '../../planning-production/entities/planning-production.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity()
export class Shift {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: string;

  @Column()
  name: string;

  @Column({ type: 'time' })
  time_start: Date;

  @Column({ type: 'time' })
  time_end: Date;

  @OneToMany(
    () => NoPlanMachine,
    (no_plan_machine_id) => no_plan_machine_id.shift,
  )
  no_plan_machine_id: NoPlanMachine[];

  @OneToMany(
    () => PlanningProduction,
    (planningProduction) => planningProduction.shift,
  )
  planningProduction: PlanningProduction[];

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  updated_At: Date;
}
