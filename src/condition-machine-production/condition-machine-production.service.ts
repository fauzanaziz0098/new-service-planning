import { InjectRepository } from '@nestjs/typeorm';
import {
  ConditionMachineProduction,
  StatusType,
} from './entities/condition-machine-production.entity';
import { Repository } from 'typeorm';
import { HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { ConditionMachineService } from 'src/condition-machine/condition-machine.service';
import { CreateConditionMachineProductionDto } from './dto/create-condition-machine-production.dto';
import { ConditionMachine } from 'src/condition-machine/entities/condition-machine.entity';
import { PlanningProductionService } from 'src/planning-production/planning-production.service';
import { VariableUserLogin } from 'src/interface/variable-user-login.interface';
import * as moment from 'moment';
import { PaginateQuery, PaginateConfig, paginate } from 'nestjs-paginate';

export class ConditionMachineProductionService {
  constructor(
    @InjectRepository(ConditionMachineProduction)
    private readonly conditionMachineProductionRepository: Repository<ConditionMachineProduction>,
    @Inject(forwardRef(() => ConditionMachineService))
    private conditionMachineService: ConditionMachineService,
    @Inject(forwardRef(() => PlanningProductionService))
    private planningProductionService: PlanningProductionService,
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

  async updateByApi(
    id: number,
    user: VariableUserLogin,
    body: { status: StatusType },
  ) {
    const planningActive = (
      await this.planningProductionService.getPlanningActive(user.client)
    ).shift();
    const diffMinute = moment().diff(
      moment(planningActive.created_at),
      'minutes',
    );
    if (diffMinute > 15) {
      throw new HttpException(
        `Gagal update kondisi mesin karena telah lebih dari 15 menit dari pembuatan planning`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.conditionMachineProductionRepository.update(id, body);
  }

  async findAll(query: PaginateQuery, user: VariableUserLogin) {
    const queryBuilder = this.conditionMachineProductionRepository
      .createQueryBuilder('conditionMachineProduction')
      .leftJoinAndSelect('conditionMachineProduction.conditionMachine', 'conditionMachine')
      .where('conditionMachineProduction.clientId = :client', { client: user.client });

    const config: PaginateConfig<ConditionMachineProduction> = {
      sortableColumns: ['id'],
      searchableColumns: ['clientId'],
    };

    return paginate<ConditionMachineProduction>(query, queryBuilder, config);
  }
}
