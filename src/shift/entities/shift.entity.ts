import { NoPlanMachine } from 'src/no-plan-machine/entities/no-plan-machine.entity';
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

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  updated_At: Date;
}
