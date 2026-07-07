import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { User } from '../../../../../platform/identity/users/entities/user.entity';
import { Site } from './site.entity';

export enum SiteRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER'
}

@Entity('site_members')
@Unique(['site', 'user']) 
export class SiteMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Site, (site) => site.members, { onDelete: 'CASCADE' })
  site: Site;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: SiteRole,
    default: SiteRole.MEMBER
  })
  role: SiteRole;
}