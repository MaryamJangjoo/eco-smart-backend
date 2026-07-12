import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum ResetMethod {
  EMAIL = 'email',
  PHONE = 'phone',
}

@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  identifier: string;

  @Column()
  token: string;

  @Column({
    type: 'enum',
    enum: ResetMethod,
    default: ResetMethod.EMAIL,
  })
  method: ResetMethod;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  used: boolean;

  @Column({ type: 'text', nullable: true })
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}