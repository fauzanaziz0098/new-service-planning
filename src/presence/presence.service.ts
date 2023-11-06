import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreatePresenceDto } from './dto/create-presence.dto';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Presence } from './entities/presence.entity';
import { Repository } from 'typeorm';
import moment from 'moment';
import { PaginateConfig, PaginateQuery, paginate } from 'nestjs-paginate';
import axios from 'axios';

@Injectable()
export class PresenceService {
  constructor(
    @InjectRepository(Presence) private readonly presenceRepository:Repository<Presence>
  ) {}

  async create(createPresenceDto: CreatePresenceDto, client_id) {
    createPresenceDto.client_id = client_id
    const existOperator = await this.presenceRepository.createQueryBuilder('presence')
    .leftJoinAndSelect('presence.planning_production', 'planning_production')
    .where('presence.client_id = :client_id', {client_id})
    .andWhere('presence.operator = :operator', {operator: createPresenceDto.operator})
    .andWhere('planning_production.id = :planningId', {planningId: createPresenceDto.planning_production})
    .getOne()

    if (existOperator) {
      throw new HttpException("This operator has been added in this plan", HttpStatus.BAD_REQUEST);
    }

    const operator = await this.presenceRepository.save(createPresenceDto)
    return operator
  }

  async getOperatorPlan(planId, clientId) {
    return this.presenceRepository.createQueryBuilder('presence')
    .leftJoinAndSelect('presence.planning_production', 'planning_production')
    .where('presence.client_id = :clientId', {clientId})
    .andWhere('planning_production.id = :planId', {planId})
    .getMany()
  }
  
  async checkIn(createPresenceDto: CreatePresenceDto) {
    const plan = await this.presenceRepository.createQueryBuilder('presence')
    .leftJoinAndSelect('presence.planning_production', 'planning_production')
    .andWhere('presence.operator = :operator', {operator: createPresenceDto.operator})
    .andWhere('planning_production.id = :planningId', {planningId: createPresenceDto.planning_production})
    .getOne()
    if (plan) {
      createPresenceDto.client_id = plan.client_id
      const validateOperator = (await axios.post(`${process.env.SERVICE_AUTH}/users/validate-presence`, createPresenceDto)).data
      if (validateOperator.data) {
        if (plan.is_absen == true) {
          return 'You already presence'
        }
        await this.presenceRepository.update(plan.id, {is_absen: true})
        return 'Success'
      }
      return 'Failed'
    }
    throw new HttpException("Operator Not Found", HttpStatus.NOT_FOUND);
    
  }

  findAll(query: PaginateQuery, clientId: string) {
    const queryBuilder = this.presenceRepository
    .createQueryBuilder('presence')
    .where('presence.client_id = :client', {client: clientId})
    var filterableColumns = {}
    if (query?.filter['operator']) {
      queryBuilder.andWhere('presence.user_id =: operator', {operator: query.filter.operator})
    }

    const config: PaginateConfig<Presence> = {
      sortableColumns: ['id'],
      searchableColumns: ['operator'],
      filterableColumns,
    }
    
    return paginate<Presence>(query, queryBuilder, config)
  }

  findOne(id: number) {
    return `This action returns a #${id} presence`;
  }

  update(id: number, updatePresenceDto: UpdatePresenceDto) {
    return `This action updates a #${id} presence`;
  }

  remove(id: number) {
    return `This action removes a #${id} presence`;
  }
}
