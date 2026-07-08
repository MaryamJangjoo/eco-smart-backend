import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  ForbiddenException, 
  BadRequestException, 
  NotFoundException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersRepository } from '../users/repositories/users.repository';
import { PasswordReset, ResetMethod } from './entities/password-reset.entity';
import * as bcrypt from 'bcryptjs'; 
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService, 
    @InjectRepository(PasswordReset)
    private readonly tokenRepository: Repository<PasswordReset>,
  ) {}

  async register(
    username: string,
    email: string,
    pass: string,
    role: string,
    phoneNumber: string,
    firstName: string,
    lastName: string,
    address: string,
    postalCode: string,
    publicKey: string,
  ) {
    const userExists = await this.usersRepository.findByUsername(username);
    if (userExists) throw new ConflictException('Username already exists');

    const emailExists = await this.usersRepository.findOne({ where: { email } });
    if (emailExists) throw new ConflictException('Email already exists');

    const phoneExists = await this.usersRepository.findOne({ where: { phoneNumber } });
    if (phoneExists) throw new ConflictException('Phone number already exists');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(pass, salt);

    const emailCode = Math.floor(10000 + Math.random() * 90000).toString();
    const hashedEmailCode = crypto.createHash('sha256').update(emailCode).digest('hex');
    
    const phoneOtp = Math.floor(10000 + Math.random() * 90000).toString();
    const hashedPhoneOtp = crypto.createHash('sha256').update(phoneOtp).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); 

    const user = this.usersRepository.create({
      username,
      email,
      passwordHash,
      role: role as any,
      phoneNumber,
      firstName,
      lastName,
      address,
      postalCode,
      publicKey,
      isEmailVerified: false,
      isPhoneVerified: false,
      emailVerificationCode: hashedEmailCode,
      phoneVerificationOtp: hashedPhoneOtp,
      verificationExpiresAt: expiresAt,
    } as any);

    await this.usersRepository.save(user);

    const emailMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #1a73e8;">🔐 ECO-SMART - Verification Codes</h2>
        <p>Dear <strong>${username}</strong>,</p>
        <p>Your verification codes are:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; color: #1a73e8; letter-spacing: 5px; margin-bottom: 10px;">
            Email Code: <strong>${emailCode}</strong>
          </div>
          <div style="font-size: 32px; font-weight: bold; color: #34a853; letter-spacing: 5px;">
            Phone Code: <strong>${phoneOtp}</strong>
          </div>
        </div>
        <p>These codes will expire in <strong>30 minutes</strong>.</p>
        <p style="font-size: 12px; color: #999;">ECO-SMART Security Team</p>
      </div>
    `;

    await this.mailerService.sendMail({
      to: email,
      subject: '🔐 ECO-SMART - Verification Codes',
      html: emailMessage,
    });

    return {
      status: 'pending_verification',
      message: 'Registration successful. Verification codes have been sent to your email.',
    };
  }

  async verifyEmail(email: string, code: string) {
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const user = await this.usersRepository.findOne({ 
      where: { email, emailVerificationCode: hashedCode } as any
    }) as any;
    
    if (!user || user.verificationExpiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired email verification code.');
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = null; 
    
    await this.usersRepository.save(user);
    return { status: 'success', message: 'Email verified successfully.' };
  }

  async verifyPhone(phoneNumber: string, otp: string) {
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await this.usersRepository.findOne({ 
      where: { phoneNumber, phoneVerificationOtp: hashedOtp } as any
    }) as any;

    if (!user || user.verificationExpiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }

    user.isPhoneVerified = true;
    user.phoneVerificationOtp = null; 
    await this.usersRepository.save(user);
    return { status: 'success', message: 'Phone number verified successfully.' };
  }

  async login(username: string, pass: string) {
    const user = await this.usersRepository.findByUsername(username) as any;

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first.');
    }

    if (!user.isPhoneVerified) {
      throw new UnauthorizedException('Please verify your phone number first.');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const tokens = await this.generateTokens(user.id, user.username, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    
    return tokens;
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersRepository.findById(userId) as any;
    if (!user || !user.currentHashedRefreshToken) throw new ForbiddenException('Access denied');

    const isMatch = await bcrypt.compare(refreshToken, user.currentHashedRefreshToken);
    if (!isMatch) throw new ForbiddenException('Invalid refresh token');

    const tokens = await this.generateTokens(user.id, user.username, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedToken = await bcrypt.hash(refreshToken, salt);
    await this.usersRepository.update(userId, { currentHashedRefreshToken: hashedToken });
  }

  private async generateTokens(userId: string, username: string, role: string) {
    const payload = { sub: userId, username, role };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
      }),
    ]);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User with this email does not exist.');
    }

    const resetCode = Math.floor(10000 + Math.random() * 90000).toString();
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const emailMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #1a73e8;">🔐 Password Reset Code</h2>
        <p>Dear <strong>${user.username}</strong>,</p>
        <p>Your password reset code is:</p>
        <div style="text-align: center; margin: 30px 0; font-size: 32px; font-weight: bold; color: #1a73e8; letter-spacing: 5px;">
          ${resetCode}
        </div>
        <p>This code will expire in <strong>15 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p style="font-size: 12px; color: #999;">ECO-SMART Security Team</p>
      </div>
    `;

    const resetRecord = this.tokenRepository.create({
      userId: user.id,
      identifier: email,
      token: hashedCode,
      method: ResetMethod.EMAIL,
      expiresAt,
      message: emailMessage,  
    });

    await this.tokenRepository.save(resetRecord);

    await this.mailerService.sendMail({
      to: email,
      subject: '🔐 ECO-SMART - Password Reset Code',
      html: emailMessage,
    });

    return { 
      status: 'success', 
      message: 'Password reset code sent to your email.',
      method: 'email',
      code: resetCode,
    };
  }

  async forgotPasswordByPhone(phoneNumber: string) {
    const user = await this.usersRepository.findOne({ where: { phoneNumber } });
    if (!user) {
      throw new NotFoundException('User with this phone number does not exist.');
    }

    const resetCode = Math.floor(10000 + Math.random() * 90000).toString();
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const smsMessage = `ECO-SMART: Your password reset code is ${resetCode}. Valid for 5 minutes.`;

    const resetRecord = this.tokenRepository.create({
      userId: user.id,
      identifier: phoneNumber,
      token: hashedCode,
      method: ResetMethod.PHONE,
      expiresAt,
      message: smsMessage, 
    });

    await this.tokenRepository.save(resetRecord);

    console.log(`📱 ${smsMessage}`);

    return { 
      status: 'success', 
      message: `Reset code sent to your phone.`,
      method: 'phone',
      code: resetCode,
    };
  }

  async resetPassword(identifier: string, code: string, pass: string) {
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const resetRecord = await this.tokenRepository.findOne({
      where: { identifier, token: hashedCode }
    });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset code.');
    }

    const user = await this.usersRepository.findById(resetRecord.userId);
    if (!user) throw new NotFoundException('User not found.');

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(pass, salt);
    
    await this.usersRepository.save(user);
    await this.tokenRepository.remove(resetRecord);

    return { 
      status: 'success', 
      message: `Password updated successfully.` 
    };
  }
}