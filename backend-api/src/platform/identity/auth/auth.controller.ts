import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Res,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';

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
import { JwtBlacklistService } from '../../../infrastructure/redis/jwt-blacklist.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(AccountingInterceptor)
export class AuthController {

  constructor(
    private readonly authService: AuthService,
    private readonly jwtBlacklistService: JwtBlacklistService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 20, ttl: 60 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body() registerDto: RegisterDto
  ) {
    return this.authService.register(
      registerDto.username,
      registerDto.email,
      registerDto.password,
      'user',
      registerDto.phoneNumber,
      registerDto.firstName,
      registerDto.lastName,
      registerDto.address || '',
      registerDto.postalCode || '',
      registerDto.publicKey || '',
    );
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  async login(
    @Body() dto: LoginDto
  ) {
    return this.authService.login(
      dto.username,
      dto.password
    );
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Req() req: any
  ) {
    const userId = req.user.sub || req.user.id;
    return this.authService.refreshTokens(
      userId,
      req.user.refreshToken
    );
  }

  @Post('forgot-password/email')
  @Throttle({ default: { limit: 3, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset code to email' })
  async forgotPasswordEmail(
    @Body() dto: ForgotPasswordDto
  ) {
    return this.authService.forgotPassword(
      dto.email
    );
  }

  @Post('forgot-password/phone')
  @Throttle({ default: { limit: 3, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset OTP to phone number' })
  async forgotPasswordPhone(
    @Body() dto: ForgotPasswordPhoneDto
  ) {
    return this.authService.forgotPasswordByPhone(
      dto.phoneNumber
    );
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with code' })
  async resetPassword(
    @Body() dto: ResetPasswordDto
  ) {
    return this.authService.resetPassword(
      dto.identifier,
      dto.token,
      dto.newPassword,
    );
  }

  @Get('verify-email')
  @SkipThrottle()
  @ApiOperation({ 
    summary: 'Verify email via link (click from email)' 
  })
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiQuery({ name: 'code', required: true, type: String })
  async verifyEmailByLink(
    @Query('email') email: string,
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.verifyEmail(email, code);
      
      if (result.status === 'success') {
        const successUrl = this.configService.get<string>('VERIFICATION_SUCCESS_URL') 
          || `${this.configService.get<string>('APP_URL') || 'http://localhost:3000'}/verification-success`;
        return res.redirect(successUrl);
      }
      
      const failUrl = this.configService.get<string>('VERIFICATION_FAIL_URL') 
        || `${this.configService.get<string>('APP_URL') || 'http://localhost:3000'}/verification-failed`;
      return res.redirect(failUrl);
      
    } catch (error) {
      const failUrl = this.configService.get<string>('VERIFICATION_FAIL_URL') 
        || `${this.configService.get<string>('APP_URL') || 'http://localhost:3000'}/verification-failed`;
      return res.redirect(failUrl);
    }
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with code (API)' })
  async verifyEmail(
    @Body() dto: VerifyEmailDto
  ) {
    return this.authService.verifyEmail(
      dto.email,
      dto.code
    );
  }

  @Post('verify-phone')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify phone number with OTP' })
  async verifyPhone(
    @Body() dto: VerifyPhoneDto
  ) {
    return this.authService.verifyPhone(
      dto.phoneNumber,
      dto.otp
    );
  }

  // Logout current device/session
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate current token' })
  async logout(
    @Req() req: any
  ) {
    const token = this.extractToken(req);
    const exp = req.user?.exp || 0;
    const expiresIn = this.jwtBlacklistService.getTokenExpiration(exp);

    if (expiresIn > 0 && token) {
      await this.jwtBlacklistService.addToBlacklist(
        token,
        expiresIn
      );
    }

    return {
      status: 'success',
      message: 'Logged out successfully',
    };
  }

  @Post('logout-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    await this.jwtBlacklistService.addUserToBlacklist(
      userId,
      86400,
    );

    return {
      status: 'success',
      message: 'Logged out from all devices successfully',
    };
  }

  @SkipThrottle()
  @Get('health')
  @ApiOperation({ summary: 'Auth health check' })
  async health() {
    return {
      status: 'ok',
      timestamp: new Date(),
    };
  }

  private extractToken(
    req: any
  ): string | null {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');

    return type === 'Bearer' ? token : null;
  }
}