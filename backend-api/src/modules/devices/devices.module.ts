// src/modules/devices/devices.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DevicesController } from './devices.controller';
import { MyBusSecurityService } from './mybus-security.service';

@Module({
  imports: [TypeOrmModule.forFeature([Device])],
  controllers: [DevicesController],
  providers: [MyBusSecurityService],
  exports: [MyBusSecurityService],
})
export class DevicesModule {}