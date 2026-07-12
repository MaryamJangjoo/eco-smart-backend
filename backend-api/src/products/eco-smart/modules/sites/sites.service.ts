import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';
import { User } from '../../../../platform/identity/users/entities/user.entity';
import { SiteRole } from '../../../../common/enums/site-role.enum';
import { RedisCacheService } from '../../../../infrastructure/redis/redis-cache.service';
@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly redisCache: RedisCacheService,
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

    await this.redisCache.del(`user:sites:${ownerId}`);

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

    await this.redisCache.del(`user:${guestUser.id}`);
    await this.redisCache.del(`site:${siteId}`);

    const updatedUser = await this.userRepository.findOne({ 
      where: { id: guestUser.id }, 
      relations: ['site'] 
    });
    return updatedUser as User;
  }

  async findAllForUser(userId: string): Promise<Site[]> {
    const cacheKey = `user:sites:${userId}`;
    
    const cached = await this.redisCache.get<Site[]>(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return cached;
    }

    const sites = await this.siteRepository
      .createQueryBuilder('site')
      .leftJoin('site.owner', 'owner')
      .leftJoin('site.users', 'user')
      .where('owner.id = :userId', { userId })
      .orWhere('user.id = :userId', { userId })
      .getMany();

    await this.redisCache.set(cacheKey, sites, 300);
    console.log(`💾 Cache set: ${cacheKey}`);

    return sites as Site[];
  }

  async findOne(siteId: string, userId: string): Promise<Site> {
    const cacheKey = `site:${siteId}:user:${userId}`;
    
    const cached = await this.redisCache.get<Site>(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return cached;
    }

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

    await this.redisCache.set(cacheKey, site, 300);
    console.log(`💾 Cache set: ${cacheKey}`);

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
    
    await this.redisCache.del(`site:${siteId}`);
    await this.redisCache.del(`user:sites:${userId}`);
    console.log(`🗑️ Cache cleared: site:${siteId}`);

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

    await this.redisCache.del(`site:${siteId}`);
    await this.redisCache.del(`user:sites:${userId}`);
    console.log(`🗑️ Cache cleared: site:${siteId}`);
  }

  async hasAccess(userId: string, siteId: string): Promise<boolean> {
    const cacheKey = `access:${userId}:${siteId}`;
    
    const cached = await this.redisCache.get<boolean>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['site', 'ownedSites'],
    });

    if (!user) {
      return false;
    }

    let hasAccess = false;
    if (user.siteId === siteId) {
      hasAccess = true;
    } else if (user.ownedSites?.some(s => s.id === siteId)) {
      hasAccess = true;
    }

    await this.redisCache.set(cacheKey, hasAccess, 60);
    console.log(`💾 Cache set: ${cacheKey} = ${hasAccess}`);

    return hasAccess;
  }

  async getUsers(siteId: string, userId: string): Promise<User[]> {
    const cacheKey = `site:users:${siteId}`;
    
    const cached = await this.redisCache.get<User[]>(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return cached;
    }

    const hasAccess = await this.hasAccess(userId, siteId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this site.');
    }

    const users = await this.userRepository.find({
      where: { siteId: siteId },
    });

    await this.redisCache.set(cacheKey, users, 120);
    console.log(`💾 Cache set: ${cacheKey}`);

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

    await this.redisCache.del(`site:users:${siteId}`);
    await this.redisCache.del(`user:${userIdToRemove}`);
    await this.redisCache.del(`access:${userIdToRemove}:${siteId}`);
    console.log(`🗑️ Cache cleared for user: ${userIdToRemove}`);
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

    await this.redisCache.del(`user:${userId}`);
    await this.redisCache.del(`site:users:${siteId}`);
    await this.redisCache.del(`access:${userId}:${siteId}`);
    console.log(`🗑️ Cache cleared for user: ${userId}`);

    const updatedUser = await this.userRepository.findOne({ 
      where: { id: userId }, 
      relations: ['site'] 
    });
    return updatedUser as User;
  }
}