import { forwardRef, Module } from '@nestjs/common';
import { NoPlanMachineService } from './no-plan-machine.service';
import { NoPlanMachineController } from './no-plan-machine.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoPlanMachine } from './entities/no-plan-machine.entity';
import { ShiftModule } from 'src/shift/shift.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NoPlanMachine]),
    forwardRef(() => ShiftModule),
  ],
  controllers: [NoPlanMachineController],
  providers: [NoPlanMachineService],
  exports: [NoPlanMachineService],
})
export class NoPlanMachineModule {}
