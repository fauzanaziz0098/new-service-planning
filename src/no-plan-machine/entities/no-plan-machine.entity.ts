import { Shift } from 'src/shift/entities/shift.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity()
export class NoPlanMachine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: string;

  @ManyToOne(() => Shift, (shift) => shift.no_plan_machine_id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ type: 'time' })
  time_in: Date;

  @Column({ type: 'time' })
  time_out: Date;

  @Column({ default: 0 })
  total: number;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  updated_At: Date;
}
