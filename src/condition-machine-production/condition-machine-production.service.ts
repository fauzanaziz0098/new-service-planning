import { InjectRepository } from '@nestjs/typeorm';
import { ConditionMachineProduction } from './entities/condition-machine-production.entity';
import { Repository } from 'typeorm';
import { Inject, forwardRef } from '@nestjs/common';
import { ConditionMachineService } from 'src/condition-machine/condition-machine.service';

export class ConditionMachineProductionService {
  constructor(
    @InjectRepository(ConditionMachineProduction)
    private readonly conditionMachineProductionRepository: Repository<ConditionMachineProduction>,
    @Inject(forwardRef(() => ConditionMachineService))
    private conditionMachineService: ConditionMachineService,
  ) {}

  async create(planningId: number, clientId: string) {
    return true;
  }
}
