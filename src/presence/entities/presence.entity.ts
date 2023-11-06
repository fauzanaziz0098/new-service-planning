import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PlanningProduction } from '../../planning-production/entities/planning-production.entity';
import { Machine } from 'src/machine/entities/machine.entity';

@Entity()
export class Presence {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    client_id: string;

    @Column()
    operator: string;

    @ManyToOne(
        () => PlanningProduction,
        (planningProduction) => planningProduction.presence,
    )
    @JoinColumn({ name: 'planning_production_id' })
    planning_production: PlanningProduction;

    @ManyToOne(
        () => Machine,
        (Machine) => Machine.presence,
    )
    @JoinColumn({ name: 'machine_id' })
    machine: Machine;
    
    @Column({default: false})
    is_absen: boolean

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}
