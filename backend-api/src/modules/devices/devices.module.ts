import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DeviceRegistry } from './entities/device-registry.entity';
import { DevicesController } from './devices.controller';
import { MyBusSecurityService } from './mybus-security.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, DeviceRegistry]),
  ],
  controllers: [DevicesController],
  providers: [MyBusSecurityService],
  exports: [MyBusSecurityService],
})
export class DevicesModule {}