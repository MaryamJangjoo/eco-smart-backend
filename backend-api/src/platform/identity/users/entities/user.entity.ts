import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index 
} from 'typeorm';
import { UserRole } from '../../../../common/enums/roles.enum';

@Entity('users')  
@Index(['username', 'email', 'phoneNumber'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'phone_number', default: '' }) 
  phoneNumber: string;

  @Column({ name: 'first_name', default: '' })
  firstName: string;

  @Column({ name: 'last_name', default: '' })
  lastName: string;

  @Column({ type: 'text', default: '' })
  address: string;

  @Column({ name: 'postal_code', default: '' })
  postalCode: string;

  @Column({ name: 'public_key', type: 'text', default: '' })
  publicKey: string;

  @Column({ name: 'password_hash', default: '' })
  passwordHash: string;

  @Column({ name: 'current_hashed_refresh_token', type: 'varchar', nullable: true })
  currentHashedRefreshToken: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'is_phone_verified', type: 'boolean', default: false })
  isPhoneVerified: boolean;

  @Column({ name: 'email_verification_code', type: 'varchar', nullable: true })
  emailVerificationCode: string; 
  @Column({ name: 'phone_verification_otp', type: 'varchar', nullable: true })
  phoneVerificationOtp: string;

  @Column({ name: 'verification_expires_at', type: 'timestamp with time zone', nullable: true })
  verificationExpiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}