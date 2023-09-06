import { Module } from '@nestjs/common';
import { ProductionReportLineStopController } from './production-report-line-stop.controller';
import { ProductionReportLineStopService } from './production-report-line-stop.service';

@Module({
  controllers: [ProductionReportLineStopController],
  providers: [ProductionReportLineStopService]
})
export class ProductionReportLineStopModule {}
