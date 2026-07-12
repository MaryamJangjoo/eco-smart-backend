import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerException } from '@nestjs/throttler';
import { RedisCacheService } from '../../infrastructure/redis/redis-cache.service';

@Injectable()
export class RedisThrottlerGuard implements CanActivate {
  constructor(
    private readonly redisCache: RedisCacheService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    const throttlerOptions = this.reflector.get(
      'throttler:options',
      context.getHandler(),
    );

    const limit = throttlerOptions?.limit || 10;
    const ttl = throttlerOptions?.ttl || 60;

    const tracker = this.getTracker(request);

    const key = `rate:${tracker}`;

    const current = await this.redisCache.get<number>(key);
    const count = current || 0;

    if (count >= limit) {
      throw new ThrottlerException('Too Many Requests');
    }

    await this.redisCache.set(key, count + 1, ttl);

    return true;
  }

  private getTracker(req: any): string {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const route = req.route?.path || req.url;
    return `${ip}:${route}`;
  }
}