import { Machine } from 'src/machine/entities/machine.entity';
import { Product } from 'src/product/entities/product.entity';
import { Shift } from 'src/shift/entities/shift.entity';
import { NoPlanMachineAdditional } from 'src/no-plan-machine-additional/entities/no-plan-machine-additional.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity()
export class PlanningProduction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: string;

  @Column()
  active_plan: boolean;

  @ManyToOne(() => Machine, (machine) => machine.planningProduction)
  @JoinColumn({ name: 'machine_id' })
  machine: Machine;

  @ManyToOne(() => Product, (product) => product.planningProduction)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Shift, (shift) => shift.planningProduction)
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column()
  qty_planning: number;

  @Column({ default: 0 })
  qty_per_hour: number;

  @Column('float', { default: 0 })
  qty_per_minute: number;

  @Column({ type: 'timestamp', nullable: true })
  date_time_in: Date;

  @Column({ type: 'timestamp', nullable: true })
  date_time_out: Date;

  @Column({ default: 0 })
  qty_reject: number;

  @Column({ default: 0 })
  total_time_actual: number;

  @Column({ default: 0 })
  total_time_planning: number;

  @Column({ nullable: true })
  remark: string;

  @Column({ nullable: true })
  dandory_time: number;

  @Column()
  user: string;

  @OneToMany(
    () => NoPlanMachineAdditional,
    (noPlanMachineAdditional) => noPlanMachineAdditional.planning_production,
  )
  no_plan_machine_additional: NoPlanMachineAdditional;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
