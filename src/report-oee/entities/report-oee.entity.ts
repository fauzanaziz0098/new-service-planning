import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('report_oee')
export class ReportOee {
  @PrimaryGeneratedColumn()
  id: number;
}
