import { Module, forwardRef } from '@nestjs/common';
import { PlanningProductionService } from './planning-production.service';
import { PlanningProductionController } from './planning-production.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningProduction } from './entities/planning-production.entity';
import { NoPlanMachineModule } from 'src/no-plan-machine/no-plan-machine.module';
import { ShiftModule } from 'src/shift/shift.module';
import { MachineModule } from 'src/machine/machine.module';
import { ProductModule } from 'src/product/product.module';
import { PlanningProductionReport } from '../planning-production-report/entities/planning-production-report.entity';
import { PlanningProductionReportModule } from 'src/planning-production-report/planning-production-report.module';
import { NoPlanMachineAdditionalModule } from 'src/no-plan-machine-additional/no-plan-machine-additional.module';
import { ReportShiftModule } from 'src/report-shift/report-shift.module';
import { ConditionMachineProductionModule } from 'src/condition-machine-production/condition-machine-production.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanningProduction, PlanningProductionReport]),
    forwardRef(() => NoPlanMachineModule),
    forwardRef(() => ShiftModule),
    forwardRef(() => MachineModule),
    forwardRef(() => ProductModule),
    forwardRef(() => PlanningProductionReportModule),
    forwardRef(() => NoPlanMachineAdditionalModule),
    forwardRef(() => ReportShiftModule),
    forwardRef(() => ConditionMachineProductionModule),
  ],
  controllers: [PlanningProductionController],
  providers: [PlanningProductionService],
  exports: [PlanningProductionService],
})
export class PlanningProductionModule {}
