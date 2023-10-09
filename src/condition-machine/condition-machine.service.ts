import { InjectRepository } from '@nestjs/typeorm';
import { ConditionMachine } from './entities/condition-machine.entity';
import { Repository } from 'typeorm';
import { CreateConditionMachineDto } from './dto/create-condition-machine.dto';
import { VariableUserLogin } from 'src/interface/variable-user-login.interface';
import { PaginateConfig, PaginateQuery, paginate } from 'nestjs-paginate';
import { UpdateConditionMachineDto } from './dto/update-condition-machine.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

export class ConditionMachineService {
  constructor(
    @InjectRepository(ConditionMachine)
    private readonly conditionMachineRepository: Repository<ConditionMachine>,
  ) {}

  async sumMachineConditionByClient(client: string) {
    return this.conditionMachineRepository
      .createQueryBuilder('conditionMachine')
      .where('conditionMachine.clientId = :client', { client })
      .getCount();
  }

  async create(
    createConditionMachineDto: CreateConditionMachineDto,
    user: VariableUserLogin,
  ) {
    const sumLineStopByClient: number = await this.sumMachineConditionByClient(
      user.client,
    );

    createConditionMachineDto['clientId'] = user.client;
    createConditionMachineDto['typeId'] = sumLineStopByClient + 1;

    const conditionMachine = this.conditionMachineRepository.create(
      createConditionMachineDto,
    );
    await this.conditionMachineRepository.save(conditionMachine);
    return 'Conditon Machine created sucessfully';
  }

  async findOne(id: number) {
    return await this.conditionMachineRepository
      .createQueryBuilder('conditionMachine')
      .where('conditionMachine.id = :id', { id })
      .getOne();
  }

  async findAll(query: PaginateQuery, user: VariableUserLogin) {
    const queryBuilder = this.conditionMachineRepository
      .createQueryBuilder('conditionMachine')
      .where('conditionMachine.clientId = :client', { client: user.client });

    const config: PaginateConfig<ConditionMachine> = {
      sortableColumns: ['id'],
      searchableColumns: ['name'],
    };

    return paginate<ConditionMachine>(query, queryBuilder, config);
  }

  async update(
    id: number,
    updateConditionMachineDto: UpdateConditionMachineDto,
    user: VariableUserLogin,
  ) {
    const oldConditonMachine = await this.findOne(id);
    await this.conditionMachineRepository.update(
      oldConditonMachine.id,
      updateConditionMachineDto,
    );

    return 'Condition Machine updated successfully';
  }

  async getDataByClient(clientId: string) {
    return await this.conditionMachineRepository
      .createQueryBuilder('conditionMachine')
      .where('conditionMachine.clientId = :clientId', { clientId })
      .getMany();
  }

  async remove(id: number) {
    const data = await this.findOne(id)

    if (data) {
      return this.conditionMachineRepository.remove(data)
    }
    throw new HttpException("Machine Condition Not Found", HttpStatus.NOT_FOUND);
    
  }
}
