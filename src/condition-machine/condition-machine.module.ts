import { forwardRef, Module } from '@nestjs/common';
import { ConditionMachineController } from './condition-machine.controller';
import { ConditionMachineService } from './condition-machine.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionMachine } from './entities/condition-machine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConditionMachine])],
  controllers: [ConditionMachineController],
  providers: [ConditionMachineService],
  exports: [ConditionMachineService],
})
export class ConditionMachineModule {}
