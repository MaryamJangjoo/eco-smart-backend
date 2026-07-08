import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';
import { SiteMember, SiteRole } from './entities/site-member.entity';
import { User } from '../../../../platform/identity/users/entities/user.entity';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,

    @InjectRepository(SiteMember)
    private readonly memberRepository: Repository<SiteMember>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly clientsService: ClientsService,
  ) {}

  async createSite(name: string, clientId: string, ownerId: string): Promise<Site> {
    const user = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!user) {
      throw new NotFoundException('Creator user not found.');
    }

    // Throws ForbiddenException/NotFoundException if the client doesn't
    // exist or isn't owned by this user.
    const client = await this.clientsService.verifyOwnership(clientId, ownerId);

    const site = this.siteRepository.create({ name, client });
    const savedSite = await this.siteRepository.save(site);

    const memberAssignment = this.memberRepository.create({
      site: savedSite,
      user,
      role: SiteRole.OWNER,
    });
    await this.memberRepository.save(memberAssignment);

    return savedSite;
  }

  async addMember(ownerId: string, siteId: string, guestEmail: string): Promise<SiteMember> {
    const ownershipCheck = await this.memberRepository.findOne({
      where: {
        site: { id: siteId },
        user: { id: ownerId },
        role: SiteRole.OWNER,
      },
    });

    if (!ownershipCheck) {
      throw new ForbiddenException('You are not the owner of this site and cannot share access.');
    }

    const guestUser = await this.userRepository.findOne({ where: { email: guestEmail } });
    if (!guestUser) {
      throw new NotFoundException('User with this email was not found on the platform.');
    }

    const existingMember = await this.memberRepository.findOne({
      where: {
        site: { id: siteId },
        user: { id: guestUser.id },
      },
    });

    if (existingMember) {
      throw new ConflictException('This user already has access to this site.');
    }

    const newMember = this.memberRepository.create({
      site: { id: siteId },
      user: guestUser,
      role: SiteRole.MEMBER,
    });

    return await this.memberRepository.save(newMember);
  }

  /**
   * A site is visible to a user either because they own the parent Client,
   * or because they've been explicitly added as a SiteMember.
   */
  async findAllForUser(userId: string): Promise<Site[]> {
    return this.siteRepository
      .createQueryBuilder('site')
      .leftJoin('site.client', 'client')
      .leftJoin('client.owner', 'clientOwner')
      .leftJoin('site.members', 'member')
      .leftJoin('member.user', 'memberUser')
      .where('clientOwner.id = :userId', { userId })
      .orWhere('memberUser.id = :userId', { userId })
      .getMany();
  }

  /**
   * Same access rule as findAllForUser, but for a single known site.
   * Used by DeviceAccessGuard so device access follows the same
   * client-ownership-or-membership rule as sites do.
   */
  async hasAccess(userId: string, siteId: string): Promise<boolean> {
    const site = await this.siteRepository.findOne({
      where: { id: siteId },
      relations: ['client', 'client.owner'],
    });

    if (!site) {
      return false;
    }

    if (site.client?.owner?.id === userId) {
      return true;
    }

    const membership = await this.memberRepository.findOne({
      where: { site: { id: siteId }, user: { id: userId } },
    });

    return !!membership;
  }
}