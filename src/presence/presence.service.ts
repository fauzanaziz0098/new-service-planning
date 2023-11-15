import { Injectable, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { CreatePresenceDto } from './dto/create-presence.dto';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Presence } from './entities/presence.entity';
import { Repository } from 'typeorm';
import moment from 'moment';
import { PaginateConfig, PaginateQuery, paginate } from 'nestjs-paginate';
import axios from 'axios';
import * as mqtt from 'mqtt';
import { PlanningProductionService } from 'src/planning-production/planning-production.service';

@Injectable()
export class PresenceService {
  private client: mqtt.MqttClient;
  constructor(
    @InjectRepository(Presence) private readonly presenceRepository:Repository<Presence>,
    @Inject(forwardRef(() => PlanningProductionService))
    private planningProductionService: PlanningProductionService,
    
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
    const plan = await this.planningProductionService.findOnePlanByMachine(createPresenceDto.machine_id)
    if (plan) {
      createPresenceDto.client_id = plan.client_id
      const validateOperator = (await axios.post(`${process.env.SERVICE_AUTH}/users/validate-presence`, createPresenceDto)).data?.data
      if (validateOperator) {
        
        // const presence = await this.presenceRepository.findOne({
        //   where: {client_id: createPresenceDto.client_id, operator: validateOperator.name, planning_production: createPresenceDto.planning_production},
        //   relations: ['planning_production', 'machine']
        // })
        const presence = await this.presenceRepository.createQueryBuilder('presence')
        .leftJoinAndSelect('presence.machine', 'machine')
        .leftJoinAndSelect('presence.planning_production', 'planning_production')
        .where('presence.client_id = :clientId', {clientId: createPresenceDto.client_id})
        .andWhere('presence.operator = :operator', {operator: validateOperator.name})
        .andWhere('planning_production.id = :planId', {planId: plan.id})
        .getOne()
        
        if (presence) {
          if (presence.is_absen == true) {
            return '2'
          }
          const message = await this.getMessage(presence.machine.id)
          this.sendMessage(message, presence)
          await this.presenceRepository.update(presence.id, {is_absen: true})
          return '1'
        }
        return '3'
      }
      throw new HttpException("Operator Not Found", HttpStatus.NOT_FOUND);
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

  async sendMessage(message, presence) {
    message.operatorId = [presence.operator]
    const sendVariable = JSON.stringify(message)
    this.client.publish(`MC${presence.machine.id}:PLAN:RPA`,sendVariable, {qos: 2, retain: true}, (error) => {
      if (error) {
        console.error('Error publishing message:', error);
      }
    },)
  }

  async getMessage(machineId) {
    return new Promise((resolve, reject) => {
      const connectUrl = process.env.MQTT_CONNECTION;

      this.client = mqtt.connect(connectUrl, {
        clientId: `mqtt_nest_${Math.random().toString(16).slice(3)}`,
        clean: true,
        connectTimeout: 4000,
        username: '',
        password: '',
        reconnectPeriod: 1000,
      });

      this.client.on('connect', () => {
        console.log('MQTT client connected');
      });

      this.client.subscribe(`MC${machineId}:PLAN:RPA`, { qos: 2 }, (err) => {
        if (err) {
          console.log(`Error subscribe topic : MC${machineId}:PLAN:RPA`, err);
        }
      });
  
      this.client.on("message", (topic, message: any) => {
        if (message) {
          const messageReceive = JSON.parse(message.toString());
          resolve(messageReceive);
        } else {
          reject(new Error('Empty message received'));
        }
      })
    })
  }
}
