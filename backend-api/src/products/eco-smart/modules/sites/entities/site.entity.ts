import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SiteMember } from './site-member.entity';
import { Device } from '../../devices/entities/device.entity';
import { Client } from '../../clients/entities/client.entity';

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => Client, (client) => client.sites, {
    onDelete: 'CASCADE',
    nullable: true,  
  })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @OneToMany(() => SiteMember, (member) => member.site, { cascade: true })
  members: SiteMember[];

  @OneToMany(() => Device, (device) => device.site)
  devices: Device[];
}