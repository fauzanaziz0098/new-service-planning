import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { LoginDTO } from './auth.dto';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-dto';
import { AccessTokenGuard } from './guards/accessToken.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() user: LoginDTO, @Req() request: Request) {
    return this.authService.login(user.username, user.password);
  }

  @UseGuards(AccessTokenGuard)
  @Get('logout')
  async logout(@Req() req: Request) {
    try {
      req.res.setHeader('Authorization', null);
      await this.authService.logout(req.user['userId']);
      return 'You have successfully logged out';
    } catch (error) {
      throw new ForbiddenException('Login Failed');
    }
  }
}
