import { Controller, Post, Body, UseInterceptors, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AccountingInterceptor } from '../../common/interceptors/accounting.interceptor';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(AccountingInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.username, dto.password, dto.role);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any) {
    const userId = req.user.sub || req.user.id; 
    return this.authService.refreshTokens(userId, req.user.refreshToken);
  }
}