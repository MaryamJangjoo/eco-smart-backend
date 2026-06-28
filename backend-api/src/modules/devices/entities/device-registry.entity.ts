import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('device_registries')
@Unique(['deviceId', 'registryAddress'])
export class DeviceRegistry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  deviceId: string;

  @Column({ type: 'integer' })
  registryAddress: number;

  @Column({ type: 'varchar', length: 255, default: '0' })
  value: string;

  @Column({ type: 'varchar', length: 50, default: 'OK' })
  status: string;

  @UpdateDateColumn()
  updatedAt: Date;
}