import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { UsersModule } from '../users/users.module';

import { JwtAccessStrategy } from './jwt-access.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';

import { RedisModule } from '../../../infrastructure/redis/redis.module';
import { JwtBlacklistService } from '../../../infrastructure/redis/jwt-blacklist.service';

import { PasswordReset } from './entities/password-reset.entity';

@Module({
  imports: [
    UsersModule,
    PassportModule,

    JwtModule.register({}),

    TypeOrmModule.forFeature([
      PasswordReset,
    ]),

    RedisModule,

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>(
            'MAIL_HOST',
            'ecosmart_mailhog',
          ),
          port: Number(
            configService.get<string>('MAIL_PORT', '1025'),
          ),
          ignoreTLS: true,
          secure: false,
        },
        defaults: {
          from: '"ECO-SMART" <no-reply@eco-smart.local>',
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtBlacklistService,
  ],

  exports: [
    AuthService,
  ],
})
export class AuthModule {}