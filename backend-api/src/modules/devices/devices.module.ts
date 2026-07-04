import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DeviceRegistry } from './entities/device-registry.entity';
import { DevicesController } from './devices.controller';
import { DeviceService } from './device.service';
import { MyBusSecurityService } from './mybus-security.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, DeviceRegistry]), 
  ],
  controllers: [DevicesController],
  providers: [
    DeviceService,           
    MyBusSecurityService,
  ],
  exports: [DeviceService, MyBusSecurityService],
})
export class DevicesModule {}