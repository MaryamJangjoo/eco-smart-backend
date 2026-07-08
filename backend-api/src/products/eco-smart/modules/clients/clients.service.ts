import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { User } from '../../../../platform/identity/users/entities/user.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createClient(name: string, ownerId: string): Promise<Client> {
    const owner = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!owner) {
      throw new NotFoundException('Owner user not found.');
    }

    const client = this.clientRepository.create({ name, owner });
    return this.clientRepository.save(client);
  }

  async findAllForUser(ownerId: string): Promise<Client[]> {
    return this.clientRepository.find({
      where: { owner: { id: ownerId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdForUser(clientId: string, ownerId: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
      relations: ['owner'],
    });

    if (!client) {
      throw new NotFoundException('Client not found.');
    }

    if (client.owner.id !== ownerId) {
      throw new ForbiddenException('You do not have access to this client.');
    }

    return client;
  }

  /**
   * Used by other modules (e.g. SitesService) to confirm a user owns a client
   * before attaching a new Site to it. Keeps cross-module access behind an
   * explicit exported method rather than a shared repository.
   */
  async verifyOwnership(clientId: string, ownerId: string): Promise<Client> {
    return this.findByIdForUser(clientId, ownerId);
  }
}