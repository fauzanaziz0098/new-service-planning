import { Module, forwardRef } from '@nestjs/common';
import { PlanningProductionService } from './planning-production.service';
import { PlanningProductionController } from './planning-production.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningProduction } from './entities/planning-production.entity';
import { NoPlanMachineModule } from 'src/no-plan-machine/no-plan-machine.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanningProduction]),
    forwardRef(() => NoPlanMachineModule),
  ],
  controllers: [PlanningProductionController],
  providers: [PlanningProductionService],
})
export class PlanningProductionModule {}
