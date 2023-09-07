import { Module } from '@nestjs/common';
import { ReportShiftController } from './report-shift.controller';
import { ReportShiftService } from './report-shift.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportShift } from './entities/report-shift.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReportShift])],
  controllers: [ReportShiftController],
  providers: [ReportShiftService],
})
export class ReportShiftModule {}
