import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { SiteMember } from '../../sites/entities/site-member.entity';

@Injectable()
export class DeviceAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,

    @InjectRepository(SiteMember)
    private readonly siteMemberRepository: Repository<SiteMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User is not authenticated.');
    }

    const deviceId = request.params.deviceId || request.body.deviceId;
    if (!deviceId) {
      throw new ForbiddenException('Device ID not found in the request.');
    }

    const device = await this.deviceRepository.findOne({
      where: { id: deviceId },
      relations: ['site'],
    });

    if (!device) {
      throw new NotFoundException('Device not found in the system.');
    }

    if (!device.site) {
      throw new NotFoundException('This device is not yet connected to any site.');
    }

    const hasAccess = await this.siteMemberRepository.findOne({
      where: {
        site: { id: device.site.id },
        user: { id: user.id },
      },
    });

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to access this device\'s site.');
    }

    return true;
  }
}