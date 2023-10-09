import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionMachineProductionService } from './condition-machine-production.service';
import { ConditionMachineProduction } from './entities/condition-machine-production.entity';
import { ConditionMachineProductionController } from './condition-machine-production.controller';
import { ConditionMachineModule } from 'src/condition-machine/condition-machine.module';
import { PlanningProductionModule } from 'src/planning-production/planning-production.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConditionMachineProduction]),
    forwardRef(() => ConditionMachineModule),
    forwardRef(() => PlanningProductionModule),
  ],
  controllers: [ConditionMachineProductionController],
  providers: [ConditionMachineProductionService],
  exports: [ConditionMachineProductionService],
})
export class ConditionMachineProductionModule {}
