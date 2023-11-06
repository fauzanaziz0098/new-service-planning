import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreatePresenceDto } from './dto/create-presence.dto';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Presence } from './entities/presence.entity';
import { Repository } from 'typeorm';
import moment from 'moment';
import { PaginateConfig, PaginateQuery, paginate } from 'nestjs-paginate';

@Injectable()
export class PresenceService {
  constructor(
    @InjectRepository(Presence) private readonly presenceRepository:Repository<Presence>
  ) {}

  async checkIn(createPresenceDto: CreatePresenceDto, clientId: string) {
    const existUser = await this.presenceRepository.createQueryBuilder('presence')
    .where('presence.client_id = :client', {clientId})
    .andWhere('DATE(presence.created_at)= :dateNow', {dateNow: moment().format('YYYY-MM-DD')})
    .andWhere('presence.user_id = :userId', {userId: createPresenceDto.user_id})
    .getOne()

    if (!existUser) {
      createPresenceDto.check_in_at = moment().toDate()
      const presence = await this.presenceRepository.save(createPresenceDto)
      return presence
    }
    throw new HttpException(`This user already check in at ${existUser.check_in_at}`, HttpStatus.BAD_REQUEST);
  }

  async checkOut(updatePresenceDto: UpdatePresenceDto, clientId: string) {
    const alreadyCheckInOut = await this.presenceRepository.createQueryBuilder('presence')
    .where('presence.client_id = :client', {clientId})
    .andWhere('DATE(presence.created_at)= :dateNow', {dateNow: moment().format('YYYY-MM-DD')})
    .andWhere('presence.user_id = :userId', {userId: updatePresenceDto.user_id})
    .andWhere('presence.check_in_at IS NOT NULL')
    .andWhere('presence.check_out_at IS NOT NULL')
    .getOne()


    const checkIn = await this.presenceRepository.createQueryBuilder('presence')
    .where('presence.client_id = :client', {clientId})
    .andWhere('DATE(presence.created_at)= :dateNow', {dateNow: moment().format('YYYY-MM-DD')})
    .andWhere('presence.user_id = :userId', {userId: updatePresenceDto.user_id})
    .andWhere('presence.check_in_at IS NOT NULL')
    .andWhere('presence.check_out_at IS NULL')
    .getOne()

    if (alreadyCheckInOut) {
      throw new HttpException(`This user already check in at ${alreadyCheckInOut.check_in_at} and check out at ${alreadyCheckInOut.check_out_at}`, HttpStatus.BAD_REQUEST);
    }
    if (checkIn) {
      updatePresenceDto.check_out_at = moment().toDate()
      const presence = await this.presenceRepository.update(checkIn.id, updatePresenceDto)
      return presence
    }
    throw new HttpException("This user not check in yet", HttpStatus.NOT_FOUND);
  }

  findAll(query: PaginateQuery, clientId: string) {
    const queryBuilder = this.presenceRepository
    .createQueryBuilder('presence')
    .where('presence.client_id = :client', {client: clientId})
    var filterableColumns = {}
    if (query?.filter['userId']) {
      queryBuilder.andWhere('presence.user_id =: userId', {userId: query.filter.userId})
    }

    const config: PaginateConfig<Presence> = {
      sortableColumns: ['id'],
      searchableColumns: ['user_id'],
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
