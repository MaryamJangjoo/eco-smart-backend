import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || 'default_refresh_secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const authorization = req.get('Authorization');
    const refreshToken = authorization ? authorization.replace('Bearer ', '').trim() : '';
    return { sub: payload.sub, username: payload.username, role: payload.role, refreshToken };
  }
}