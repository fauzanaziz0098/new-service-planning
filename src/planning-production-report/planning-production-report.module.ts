import { Module } from '@nestjs/common';
import { PlanningProductionReportService } from './planning-production-report.service';
import { PlanningProductionReportController } from './planning-production-report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningProductionReport } from './entities/planning-production-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlanningProductionReport])],
  controllers: [PlanningProductionReportController],
  providers: [PlanningProductionReportService],
  exports: [PlanningProductionReportService],
})
export class PlanningProductionReportModule {}
