import { Module } from '@nestjs/common';
import { ReportShiftController } from './report-shift.controller';
import { ReportShiftService } from './report-shift.service';

@Module({
  controllers: [ReportShiftController],
  providers: [ReportShiftService]
})
export class ReportShiftModule {}
