import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RedisService } from '../../../redis/redis.service';
import { JwtRefreshPayload } from '../../../common/types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    super({
      // Token lives in HttpOnly cookie — never touches JS
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => (req?.cookies as Record<string, string>)?.['refresh_token'] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.refreshSecret') as string,
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtRefreshPayload): Promise<{ id: string; jti: string }> {
    // Verify this specific token instance exists in Redis (whitelist)
    const storedUserId = await this.redis.getRefreshToken(payload.jti);
    if (!storedUserId || storedUserId !== payload.sub) {
      throw new UnauthorizedException('Refresh token revoked or invalid');
    }
    return { id: payload.sub, jti: payload.jti };
  }
}
