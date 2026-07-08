import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { SitesService } from '../../sites/sites.service';

@Injectable()
export class DeviceAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,

    private readonly sitesService: SitesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = user ? (user.sub || user.id) : undefined;

    if (!userId) {
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

    // Access is granted if the user owns the site's parent Client, or is a
    // SiteMember of the device's site — same rule SitesService uses.
    const hasAccess = await this.sitesService.hasAccess(userId, device.site.id);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to access this device\'s site.');
    }

    return true;
  }
}