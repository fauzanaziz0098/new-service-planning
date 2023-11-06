import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Presence {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    planning_id: number;

    @Column()
    shift_id: number;

    @Column({nullable: true})
    check_in_at: Date

    @Column({nullable: true})
    check_out_at: Date

    @Column()
    card_number: boolean

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}
