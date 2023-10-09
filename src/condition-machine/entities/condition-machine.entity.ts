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
import { ConditionMachineProduction } from 'src/condition-machine-production/entities/condition-machine-production.entity';

@Entity('condition_machine')
export class ConditionMachine {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  name: string;

  @Column({ name: 'client', nullable: true })
  clientId: string;

  @Column({ name: 'type_id' })
  typeId: number;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @OneToMany(
    () => ConditionMachineProduction,
    (conditionMachineProduction) => conditionMachineProduction.conditionMachine,
  )
  conditionMachineProduction: ConditionMachineProduction[];
}
