import { Module } from '@nestjs/common';
import { ProductionReportLineStopController } from './production-report-line-stop.controller';
import { ProductionReportLineStopService } from './production-report-line-stop.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionReportLineStop } from './entities/production-report-line-stop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionReportLineStop])],
  controllers: [ProductionReportLineStopController],
  providers: [ProductionReportLineStopService],
  exports: [ProductionReportLineStopService],
})
export class ProductionReportLineStopModule {}
