import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { User } from './modules/users/entities/user.entity';

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
        
        entities: [User],
        synchronize: true, 
      }),
    }),

    
    AuthModule,
    UsersModule,
    HealthModule,
  ],
})
export class AppModule {}