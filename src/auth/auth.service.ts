import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-dto';
import { EntityNotFoundError } from 'typeorm';
import { Role } from 'src/common/enums/role';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findOne({ username });

    if (user && bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(username: string, password: string) {
    const user = await this.userService.findOneUsernameOrEmail(username);

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload = {
        username: user.username,
        email: user.email,
        sub: user.id,
        role: user?.role?.name,
      };
      user['token'] = this.jwtService.sign(payload);
      const { password, created, updated, ...result } = user;

      return result;
    }
    throw new BadRequestException('Invalid Credential');
  }

  async logout(userId: string) {
    const user = await this.userService.findOne(userId);
  }
}
