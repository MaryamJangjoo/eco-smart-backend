import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DevicesController } from './devices.controller';
import { DeviceService } from './device.service';
import { MyBusModule } from '../../../../infrastructure/mybus/mybus.module';
import { SitesModule } from '../sites/sites.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device]),
    MyBusModule,
    SitesModule,
  ],
  controllers: [DevicesController],
  providers: [
    DeviceService,
  ],
  exports: [DeviceService, TypeOrmModule], 
})
export class DevicesModule {}