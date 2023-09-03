import { Module, forwardRef } from '@nestjs/common';
import { MachineService } from './machine.service';
import { MachineController } from './machine.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Machine } from './entities/machine.entity';
import { PublicFunctionModule } from 'src/public-function/public-function.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Machine]),
    forwardRef(() => PublicFunctionModule),
  ],
  controllers: [MachineController],
  providers: [MachineService],
  exports: [MachineService],
})
export class MachineModule {}
