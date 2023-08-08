import { IsEmail, IsNotEmpty } from 'class-validator';

export class RegisterUserDto {
    username: string;

    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    password: string;
}

