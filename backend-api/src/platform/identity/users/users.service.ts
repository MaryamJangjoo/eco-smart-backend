import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { User } from './entities/user.entity';
import { SiteRole } from '../../../common/enums/site-role.enum';  

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return user;
  }

  async getUsersBySite(siteId: string): Promise<User[]> {
    return this.usersRepository.findUsersBySite(siteId);
  }

  async addUserToSite(userId: string, siteId: string, role: SiteRole): Promise<User> {
    const user = await this.findById(userId);
    if (user.site) {
      throw new ConflictException('User already belongs to a site');
    }
    
    user.siteId = siteId;
    user.siteRole = role;
    await this.usersRepository.save(user);
    
    return this.findById(userId);
  }

  async removeUserFromSite(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user.site) {
      throw new ConflictException('User does not belong to any site');
    }
    
    user.siteId = null;
    user.siteRole = null;
    await this.usersRepository.save(user);
    
    return this.findById(userId);
  }

  async changeUserRole(userId: string, newRole: SiteRole): Promise<User> {
    const user = await this.findById(userId);
    if (!user.site) {
      throw new ConflictException('User does not belong to any site');
    }
    
    user.siteRole = newRole;
    await this.usersRepository.save(user);
    
    return this.findById(userId);
  }

  async isUserInSite(userId: string, siteId: string): Promise<boolean> {
    const user = await this.findById(userId);
    return user.site?.id === siteId;
  }

  async getUsersWithoutSite(): Promise<User[]> {
    return this.usersRepository.findUsersWithoutSite();
  }
}