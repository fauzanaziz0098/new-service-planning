import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ConditionMachine } from 'src/condition-machine/entities/condition-machine.entity';

export enum StatusType {
  NORMAL = 0,
  KRITIS = 1,
  TROUBLE = 2,
}

@Entity('condition_machine_production')
export class ConditionMachineProduction {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(
    () => ConditionMachine,
    (conditionMachine) => conditionMachine.conditionMachineProduction,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'condition_machine_id' })
  conditionMachine: ConditionMachine;

  @Column({ name: 'client', nullable: true })
  clientId: string;

  @Column({ name: 'planningId', nullable: true })
  planningId: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: StatusType,
    default: StatusType.NORMAL,
  })
  status: StatusType;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
