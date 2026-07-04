import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
  ) {}

  async register(dto: RegisterDeviceDto): Promise<Device> {
    const existingDevice = await this.deviceRepository.findOne({
      where: { deviceId: dto.deviceId }
    });

    if (existingDevice) {
      throw new BadRequestException(`Device with ID ${dto.deviceId} already exists`);
    }

    const existingSerial = await this.deviceRepository.findOne({
      where: { serialNumber: dto.serialNumber }
    });

    if (existingSerial) {
      throw new BadRequestException(`Device with serial ${dto.serialNumber} already exists`);
    }

    const device = this.deviceRepository.create(dto);
    return this.deviceRepository.save(device);
  }

  async findByDeviceId(deviceId: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { deviceId }
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    return device;
  }

  async findAll(): Promise<Device[]> {
    return this.deviceRepository.find({
      order: { createdAt: 'DESC' }
    });
  }
}