import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from '../platform/identity/auth/auth.module';
import { UsersModule } from '../platform/identity/users/users.module';
import { MyBusModule } from '../infrastructure/mybus/mybus.module';
import { HealthModule } from './health/health.module';
import { DevicesModule } from '../products/eco-smart/modules/devices/devices.module';
import { SitesModule } from '../products/eco-smart/modules/sites/sites.module';
import { GatewaysModule } from '../gateways/gateways.module';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { RedisThrottlerGuard } from '../common/guards/redis-throttler.guard';
import { JwtBlacklistService } from '../infrastructure/redis/jwt-blacklist.service';
import { JwtBlacklistGuard } from '../infrastructure/redis/jwt-blacklist.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('THROTTLE_TTL', 60),
            limit: configService.get<number>('THROTTLE_LIMIT', 10),
          },
        ],
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'ecosmart_postgres'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'ecosmart_admin'),
        password: configService.get<string>('DB_PASSWORD', 'ecosmart_secure_pass'),
        database: configService.get<string>('DB_NAME', 'ecosmart_core'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST', 'ecosmart_mailhog'),
          port: configService.get<number>('MAIL_PORT', 1025),
          ignoreTLS: true,
          secure: false,
        },
        defaults: {
          from: '"ECO-SMART Support" <no-reply@ecosmart.local>',
        },
      }),
    }),

    RedisModule,
    MyBusModule,
    AuthModule,
    UsersModule,
    HealthModule,
    SitesModule,
    DevicesModule,
    GatewaysModule,
  ],
  providers: [
    JwtBlacklistService,

    {
      provide: APP_GUARD,
      useClass: JwtBlacklistGuard,
    },

    {
      provide: APP_GUARD,
      useClass: RedisThrottlerGuard,
    },
  ],
})
export class AppModule {}