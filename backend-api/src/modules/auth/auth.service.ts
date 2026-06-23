import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../users/repositories/users.repository';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(username: string, pass: string, role: string) {
    const userExists = await this.usersRepository.findByUsername(username);
    if (userExists) throw new ConflictException('Username already exists');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(pass, salt);

    const user = this.usersRepository.create({ username, passwordHash, role: role as any });
    return this.usersRepository.save(user);
  }

  async login(username: string, pass: string) {
    const user = await this.usersRepository.findByUsername(username);
    if (!user) throw new UnauthorizedException('Invalid username or password');

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid username or password');

    const tokens = await this.generateTokens(user.id, user.username, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersRepository.findById(userId);
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
}