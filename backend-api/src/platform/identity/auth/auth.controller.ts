import {
  Controller, 
  Post, 
  Body, 
  Get,
  Query,
  UseInterceptors, 
  HttpCode, 
  HttpStatus, 
  Req, 
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ForgotPasswordPhoneDto } from './dto/forgot-password-phone.dto'; 
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';  
import { AccountingInterceptor } from '../../../common/interceptors/accounting.interceptor';
import { JwtRefreshGuard } from '../../../common/guards/jwt-refresh.guard';

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(AccountingInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.username,
      registerDto.email,
      registerDto.password,
      registerDto.role ? registerDto.role.toString() : 'user',
      registerDto.phoneNumber,
      registerDto.firstName,
      registerDto.lastName,
      registerDto.address,
      registerDto.postalCode,
      registerDto.publicKey,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.authService.refreshTokens(userId, req.user.refreshToken);
  }

  @Post('forgot-password/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset code to email' })
  async forgotPasswordEmail(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('forgot-password/phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset OTP to phone number' })
  async forgotPasswordPhone(@Body() dto: ForgotPasswordPhoneDto) {
    return this.authService.forgotPasswordByPhone(dto.phoneNumber);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with code' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.identifier,
      dto.token,
      dto.newPassword,
    );
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with 5-digit code' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Post('verify-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify phone number with OTP' })
  async verifyPhone(@Body() dto: VerifyPhoneDto) {
    return this.authService.verifyPhone(dto.phoneNumber, dto.otp);
  }
}