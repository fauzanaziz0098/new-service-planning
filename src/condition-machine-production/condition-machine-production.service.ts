import { InjectRepository } from '@nestjs/typeorm';
import { ConditionMachineProduction } from './entities/condition-machine-production.entity';
import { Repository } from 'typeorm';
import { Inject, forwardRef } from '@nestjs/common';
import { ConditionMachineService } from 'src/condition-machine/condition-machine.service';
import { CreateConditionMachineProductionDto } from './dto/create-condition-machine-production.dto';
import { ConditionMachine } from 'src/condition-machine/entities/condition-machine.entity';

export class ConditionMachineProductionService {
  constructor(
    @InjectRepository(ConditionMachineProduction)
    private readonly conditionMachineProductionRepository: Repository<ConditionMachineProduction>,
    @Inject(forwardRef(() => ConditionMachineService))
    private conditionMachineService: ConditionMachineService,
  ) {}

  async create(planningId: number, clientId: string) {
    const conditionMachine = await this.conditionMachineService.getDataByClient(
      clientId,
    );

    const datas: CreateConditionMachineProductionDto[] = conditionMachine.map(
      (item: ConditionMachine) => {
        return {
          conditionMachine: item,
          clientId,
          planningId,
        };
      },
    );

    return await this.conditionMachineProductionRepository.save(datas);
  }
}
