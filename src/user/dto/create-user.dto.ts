import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty } from 'class-validator';
import { Role } from 'src/role/entities/role.entity';

export class CreateUserDto {
  username: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  role: Role;
}
