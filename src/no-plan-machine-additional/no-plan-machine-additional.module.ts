import { Module, forwardRef } from '@nestjs/common';
import { NoPlanMachineAdditionalService } from './no-plan-machine-additional.service';
import { NoPlanMachineAdditionalController } from './no-plan-machine-additional.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoPlanMachineAdditional } from './entities/no-plan-machine-additional.entity';
import { NoPlanMachine } from '../no-plan-machine/entities/no-plan-machine.entity';
import { PlanningProductionModule } from '../planning-production/planning-production.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NoPlanMachineAdditional, NoPlanMachine]),
    forwardRef(() => PlanningProductionModule),
  ],
  controllers: [NoPlanMachineAdditionalController],
  providers: [NoPlanMachineAdditionalService],
})
export class NoPlanMachineAdditionalModule {}
