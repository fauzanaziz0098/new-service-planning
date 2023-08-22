import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // const user = await this.userRepository.findOne({
    //   where: { email: payload.email },
    // });

    // if (!user) {
    //   return null;
    // }
    const tokenExpired = this.isTokenExpired(payload.exp);

    if (tokenExpired) {
      throw new UnauthorizedException('Token has expired');
    }

    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      client: payload.client,
    };
  }

  private isTokenExpired(expirationTime: number): boolean {
    const currentTime = Math.floor(Date.now() / 1000); // Get current Unix timestamp
    return expirationTime < currentTime;
  }
}
