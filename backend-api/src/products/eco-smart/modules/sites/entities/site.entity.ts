import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToMany, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { User } from '../../../../../platform/identity/users/entities/user.entity';  
import { Device } from '../../devices/entities/device.entity';

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'commercial' })
  type: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  contact: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.ownedSites, { onDelete: 'CASCADE' })
  owner: User;

  @Column({ nullable: true })
  ownerId: string;

  @OneToMany(() => User, (user) => user.site)
  users: User[];

  @OneToMany(() => Device, (device) => device.site, { cascade: true })
  devices: Device[];
}