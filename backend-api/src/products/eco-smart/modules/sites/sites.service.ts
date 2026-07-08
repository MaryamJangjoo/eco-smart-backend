import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';
import { User } from '../../../../platform/identity/users/entities/user.entity';
import { SiteRole } from '../../../../common/enums/site-role.enum';

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createSite(name: string, ownerId: string): Promise<Site> {
    const user = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const site = this.siteRepository.create({
      name,
      ownerId: user.id
    });
    const savedSite = await this.siteRepository.save(site);

    user.siteId = savedSite.id;
    user.siteRole = SiteRole.OWNER;
    await this.userRepository.save(user);

    return savedSite;
  }

  async addUserToSite(ownerId: string, siteId: string, guestEmail: string): Promise<User> {
    const owner = await this.userRepository.findOne({
      where: { 
        id: ownerId, 
        siteId: siteId, 
        siteRole: SiteRole.OWNER 
      },
      relations: ['site'],
    });

    if (!owner) {
      throw new ForbiddenException('You are not the owner of this site.');
    }

    const guestUser = await this.userRepository.findOne({ where: { email: guestEmail } });
    if (!guestUser) {
      throw new NotFoundException('User with this email was not found.');
    }

    if (guestUser.siteId) {
      throw new ConflictException('This user already belongs to a site.');
    }

    guestUser.siteId = siteId;
    guestUser.siteRole = SiteRole.VIEWER;
    await this.userRepository.save(guestUser);

    const updatedUser = await this.userRepository.findOne({ 
      where: { id: guestUser.id }, 
      relations: ['site'] 
    });
    return updatedUser as User;
  }

  async findAllForUser(userId: string): Promise<Site[]> {
    const sites = await this.siteRepository
      .createQueryBuilder('site')
      .leftJoin('site.owner', 'owner')
      .leftJoin('site.users', 'user')
      .where('owner.id = :userId', { userId })
      .orWhere('user.id = :userId', { userId })
      .getMany();
    
    return sites as Site[];
  }

  async findOne(siteId: string, userId: string): Promise<Site> {
    const site = await this.siteRepository.findOne({
      where: { id: siteId },
      relations: ['owner', 'users'],
    });

    if (!site) {
      throw new NotFoundException('Site not found.');
    }

    const hasAccess = await this.hasAccess(userId, siteId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this site.');
    }

    return site as Site;
  }

  async updateSite(siteId: string, userId: string, updateData: Partial<Site>): Promise<Site> {
    const user = await this.userRepository.findOne({
      where: { 
        id: userId, 
        siteId: siteId 
      },
      relations: ['site'],
    });

    if (!user) {
      throw new ForbiddenException('You do not have access to this site.');
    }

    if (user.siteRole !== SiteRole.OWNER && user.siteRole !== SiteRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this site.');
    }

    await this.siteRepository.update(siteId, updateData);
    const updatedSite = await this.siteRepository.findOne({ where: { id: siteId } });
    return updatedSite as Site;
  }

  async deleteSite(siteId: string, userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { 
        id: userId, 
        siteId: siteId, 
        siteRole: SiteRole.OWNER 
      },
      relations: ['site'],
    });

    if (!user) {
      throw new ForbiddenException('Only the owner can delete this site.');
    }

    await this.siteRepository.delete(siteId);
  }

  async hasAccess(userId: string, siteId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['site', 'ownedSites'],
    });

    if (!user) {
      return false;
    }

    if (user.siteId === siteId) {
      return true;
    }

    if (user.ownedSites?.some(s => s.id === siteId)) {
      return true;
    }

    return false;
  }

  async getUsers(siteId: string, userId: string): Promise<User[]> {
    const hasAccess = await this.hasAccess(userId, siteId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this site.');
    }

    const users = await this.userRepository.find({
      where: { siteId: siteId },
    });
    
    return users as User[];
  }

  async removeUserFromSite(siteId: string, ownerId: string, userIdToRemove: string): Promise<void> {
    const owner = await this.userRepository.findOne({
      where: { 
        id: ownerId, 
        siteId: siteId, 
        siteRole: SiteRole.OWNER 
      },
      relations: ['site'],
    });

    if (!owner) {
      throw new ForbiddenException('Only the owner can remove users.');
    }

    if (ownerId === userIdToRemove) {
      throw new ForbiddenException('You cannot remove yourself as the owner.');
    }

    const user = await this.userRepository.findOne({
      where: { 
        id: userIdToRemove, 
        siteId: siteId 
      },
      relations: ['site'],
    });

    if (!user) {
      throw new NotFoundException('User not found in this site.');
    }

    user.siteId = null as any;
    user.siteRole = null as any;
    user.site = null as any;
    await this.userRepository.save(user);
  }

  async changeUserRole(
    siteId: string, 
    ownerId: string, 
    userId: string, 
    newRole: SiteRole
  ): Promise<User> {
    const owner = await this.userRepository.findOne({
      where: { 
        id: ownerId, 
        siteId: siteId, 
        siteRole: SiteRole.OWNER 
      },
      relations: ['site'],
    });

    if (!owner) {
      throw new ForbiddenException('Only the owner can change user roles.');
    }

    const user = await this.userRepository.findOne({
      where: { 
        id: userId, 
        siteId: siteId 
      },
      relations: ['site'],
    });

    if (!user) {
      throw new NotFoundException('User not found in this site.');
    }

    if (user.siteRole === SiteRole.OWNER) {
      throw new ForbiddenException('Cannot change the role of the site owner.');
    }

    user.siteRole = newRole;
    await this.userRepository.save(user);

    const updatedUser = await this.userRepository.findOne({ 
      where: { id: userId }, 
      relations: ['site'] 
    });
    return updatedUser as User;
  }
}