import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn,
  ManyToOne,
  JoinColumn 
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  identifier: string;  

  @Column({
    type: 'enum',
    enum: ResetMethod,
    default: ResetMethod.EMAIL,
  })
  method: ResetMethod;

  @Column()
  token: string;  

  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @Column({ type: 'text', nullable: true })
  message: string; 
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}