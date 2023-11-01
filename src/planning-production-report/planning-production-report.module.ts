import { Module, forwardRef } from '@nestjs/common';
import { PlanningProductionReportService } from './planning-production-report.service';
import { PlanningProductionReportController } from './planning-production-report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningProductionReport } from './entities/planning-production-report.entity';
import { ProductionReportLineStopModule } from 'src/production-report-line-stop/production-report-line-stop.module';
import { ShiftModule } from 'src/shift/shift.module';
import { PlanningProductionModule } from 'src/planning-production/planning-production.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanningProductionReport]),
    forwardRef(() => ProductionReportLineStopModule),
    forwardRef(() => ShiftModule),
    forwardRef(() => PlanningProductionModule),
  ],
  controllers: [PlanningProductionReportController],
  providers: [PlanningProductionReportService],
  exports: [PlanningProductionReportService],
})
export class PlanningProductionReportModule {}
