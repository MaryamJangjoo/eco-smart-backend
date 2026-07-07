import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SiteMember } from './site-member.entity';
import { Device } from '../../devices/entities/device.entity';

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; 

  @OneToMany(() => SiteMember, (member) => member.site, { cascade: true })
  members: SiteMember[];

  @OneToMany(() => Device, (device) => device.site)
  devices: Device[];
}