import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthModule } from '../platform/identity/auth/auth.module';
import { UsersModule } from '../platform/identity/users/users.module';
import { MyBusModule } from '../infrastructure/mybus/mybus.module';
import { HealthModule } from './health/health.module';
import { DevicesModule } from '../products/eco-smart/modules/devices/devices.module';
import { SitesModule } from '../products/eco-smart/modules/sites/sites.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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

    MyBusModule,
    AuthModule,
    UsersModule,
    HealthModule,
    SitesModule,
    DevicesModule,
  ],
})
export class AppModule {}