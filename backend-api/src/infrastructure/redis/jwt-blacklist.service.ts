import { Injectable } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtBlacklistService {
  constructor(
    private readonly redisCache: RedisCacheService,
    private readonly configService: ConfigService,
  ) {}

  async addToBlacklist(
    token: string,
    expiresIn: number,
  ): Promise<void> {

    const key = `blacklist:token:${token}`;

    await this.redisCache.set(
      key,
      'true',
      expiresIn,
    );
  }

  async addUserToBlacklist(
    userId: string,
    expiresIn: number = 86400,
  ): Promise<void> {

    const key = `blacklist:user:${userId}`;

    await this.redisCache.set(
      key,
      'true',
      expiresIn,
    );
  }

  async isBlacklisted(
    token: string,
  ): Promise<boolean> {

    const key = `blacklist:token:${token}`;

    const result =
      await this.redisCache.get<string>(key);

    return result === 'true';
  }


  async isUserBlacklisted(
    userId: string,
  ): Promise<boolean> {

    const key = `blacklist:user:${userId}`;

    const result =
      await this.redisCache.get<string>(key);

    return result === 'true';
  }


  async removeFromBlacklist(
    token: string,
  ): Promise<void> {

    const key = `blacklist:token:${token}`;

    await this.redisCache.del(key);
  }


  getTokenExpiration(
    exp: number,
  ): number {

    const now =
      Math.floor(Date.now() / 1000);

    const remaining =
      exp - now;

    return remaining > 0
      ? remaining
      : 0;
  }
}