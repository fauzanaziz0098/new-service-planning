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

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanningProduction, PlanningProductionReport]),
    forwardRef(() => NoPlanMachineModule),
    forwardRef(() => ShiftModule),
    forwardRef(() => MachineModule),
    forwardRef(() => ProductModule),
    forwardRef(() => PlanningProductionReportModule),
  ],
  controllers: [PlanningProductionController],
  providers: [PlanningProductionService],
})
export class PlanningProductionModule {}
