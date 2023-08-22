import { Machine } from 'src/machine/entities/machine.entity';
import { Product } from 'src/product/entities/product.entity';
import { Shift } from 'src/shift/entities/shift.entity';
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

  @Column({ default: 0 })
  qty_planning: number;

  @Column({ default: 0 })
  qty_per_hour: number;

  @Column({ default: 0 })
  qty_per_minute: number;

  @Column({ type: 'timestamp' })
  date_time_in: Date;

  @Column({ type: 'timestamp' })
  date_time_out: Date;

  @Column({ default: 0 })
  qty_reject: number;

  @Column({ default: 0 })
  total: number;

  @Column({ nullable: true })
  remark: string;

  @Column({ nullable: true })
  dandory_time: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
