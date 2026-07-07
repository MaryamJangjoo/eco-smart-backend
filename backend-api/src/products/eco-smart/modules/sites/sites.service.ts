import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';
import { SiteMember, SiteRole } from './entities/site-member.entity';
import { User } from '../../../../platform/identity/users/entities/user.entity';
@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,

    @InjectRepository(SiteMember)
    private readonly memberRepository: Repository<SiteMember>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createSite(name: string, ownerId: string): Promise<Site> {
    const user = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!user) {
      throw new NotFoundException('Creator user not found.');
    }

    const site = this.siteRepository.create({ name });
    const savedSite = await this.siteRepository.save(site);

    const memberAssignment = this.memberRepository.create({
      site: savedSite,
      user: user,
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
}