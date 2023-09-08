import { Module, forwardRef } from '@nestjs/common';
import { ReportShiftController } from './report-shift.controller';
import { ReportShiftService } from './report-shift.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportShift } from './entities/report-shift.entity';
import { ShiftModule } from 'src/shift/shift.module';
import { PlanningProductionModule } from 'src/planning-production/planning-production.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportShift]),
    ScheduleModule.forRoot(),
    forwardRef(() => ShiftModule),
    forwardRef(() => PlanningProductionModule),
  ],
  controllers: [ReportShiftController],
  providers: [ReportShiftService],
  exports: [ReportShiftService],
})
export class ReportShiftModule {}
