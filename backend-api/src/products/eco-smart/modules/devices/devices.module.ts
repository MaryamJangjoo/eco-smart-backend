import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DevicesController } from './devices.controller';
import { DeviceService } from './device.service';
import { SiteMember } from '../sites/entities/site-member.entity';
import { MyBusModule } from '../../../../infrastructure/mybus/mybus.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, SiteMember]),
    
    MyBusModule,
  ],
  controllers: [DevicesController],
  providers: [
    DeviceService,
  ],
  exports: [DeviceService, TypeOrmModule], 
})
export class DevicesModule {}