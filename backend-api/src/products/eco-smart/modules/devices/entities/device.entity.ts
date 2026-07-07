import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Site } from '../../sites/entities/site.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  deviceId: string;

  @Column({ unique: true })
  serialNumber: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  firmwareVersion: string;

  @Column({ default: 'active' })
  status: string;

  @ManyToOne(() => Site, (site) => site.devices, { onDelete: 'CASCADE' })
  site: Site;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}