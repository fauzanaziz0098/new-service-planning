import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Role } from 'src/common/enums/role';
import { RoleService } from 'src/role/role.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => RoleService))
    private roleService: RoleService,
  ) {}

  async create(createUserDto: CreateUserDto, userId: string) {
    const user = this.userRepository.create(createUserDto);

    await this.userRepository.save(user);
    return 'User created successfully';
  }

  async findOne(id: any) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :id', {
        id,
      })
      .getOne();

    if (user) {
      return user;
    }

    throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
  }

  findOneUsernameOrEmail(val: any) {
    return this.userRepository.findOneOrFail({
      where: [{ username: val }, { email: val }],
      relations: ['role'],
    });
  }
}
