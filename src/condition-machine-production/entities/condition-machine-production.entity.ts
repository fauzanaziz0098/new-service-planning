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

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
