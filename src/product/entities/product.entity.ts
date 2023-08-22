import { PlanningProduction } from 'src/planning-production/entities/planning-production.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: string;

  @Column({ unique: true })
  part_name: string;

  @Column()
  part_number: string;

  @Column()
  cycle_time: number;

  @Column({ default: false })
  status: boolean;

  @Column()
  unit: string;

  @OneToMany(
    () => PlanningProduction,
    (planningProduction) => planningProduction.product,
  )
  planningProduction: PlanningProduction;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
