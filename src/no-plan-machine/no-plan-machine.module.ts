import { forwardRef, Module } from '@nestjs/common';
import { NoPlanMachineService } from './no-plan-machine.service';
import { NoPlanMachineController } from './no-plan-machine.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoPlanMachine } from './entities/no-plan-machine.entity';
import { ShiftModule } from 'src/shift/shift.module';
import { PlanningProductionModule } from 'src/planning-production/planning-production.module';
import { PlanningProductionReportModule } from 'src/planning-production-report/planning-production-report.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NoPlanMachine]),
    forwardRef(() => ShiftModule),
    forwardRef(() => PlanningProductionModule),
    forwardRef(() => PlanningProductionReportModule),
  ],
  controllers: [NoPlanMachineController],
  providers: [NoPlanMachineService],
  exports: [NoPlanMachineService],
})
export class NoPlanMachineModule {}
