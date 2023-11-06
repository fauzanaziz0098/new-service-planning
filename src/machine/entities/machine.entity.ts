import { PlanningProduction } from 'src/planning-production/entities/planning-production.entity';
import { Presence } from 'src/presence/entities/presence.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity()
export class Machine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: string;

  @Column()
  name: string;

  @Column()
  number: number;

  @OneToMany(
    () => PlanningProduction,
    (planningProudction) => planningProudction.machine,
  )
  planningProduction: PlanningProduction[];

  @OneToMany(
    () => Presence,
    (planningProudction) => planningProudction.machine,
  )
  presence: Presence;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
