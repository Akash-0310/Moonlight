import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { Key, TTL } from '../../redis/redis.constants';

export interface DeviceSession {
  jti: string;
  deviceId: string;
  userAgent: string;
  ip: string;
  createdAt: string;
  lastSeenAt: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly redis: RedisService) {}

  // ─── Register a device session on login ──────────────────────────────────

  async registerSession(
    userId: string,
    jti: string,
    meta: { deviceId: string; userAgent: string; ip: string },
  ): Promise<void> {
    const session: DeviceSession = {
      jti,
      deviceId: meta.deviceId,
      userAgent: meta.userAgent,
      ip: meta.ip,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };

    // Store session details under device key
    const deviceKey = Key.auth.deviceSession(userId, meta.deviceId);
    await this.redis.setJson(deviceKey, session, TTL.DEVICE_SESSION);

    // Add device to user's session set
    await this.redis.sadd(Key.auth.userSessions(userId), meta.deviceId);
    await this.redis.expire(Key.auth.userSessions(userId), TTL.DEVICE_SESSION);
  }

  // ─── Update last seen ─────────────────────────────────────────────────────

  async touchSession(userId: string, deviceId: string): Promise<void> {
    const deviceKey = Key.auth.deviceSession(userId, deviceId);
    const session = await this.redis.getJson<DeviceSession>(deviceKey);
    if (session) {
      session.lastSeenAt = new Date().toISOString();
      await this.redis.setJson(deviceKey, session, TTL.DEVICE_SESSION);
    }
  }

  // ─── List all active sessions for a user ─────────────────────────────────

  async getUserSessions(userId: string): Promise<DeviceSession[]> {
    const deviceIds = await this.redis.smembers(Key.auth.userSessions(userId));
    const sessions: DeviceSession[] = [];

    for (const deviceId of deviceIds) {
      const session = await this.redis.getJson<DeviceSession>(
        Key.auth.deviceSession(userId, deviceId),
      );
      if (session) {
        sessions.push(session);
      } else {
        // Clean up stale device reference
        await this.redis.srem(Key.auth.userSessions(userId), deviceId);
      }
    }

    return sessions;
  }

  // ─── Revoke a specific device session ────────────────────────────────────

  async revokeSession(userId: string, deviceId: string): Promise<void> {
    const session = await this.redis.getJson<DeviceSession>(
      Key.auth.deviceSession(userId, deviceId),
    );

    if (session) {
      // Blacklist the refresh token
      await this.redis.deleteRefreshToken(session.jti);
    }

    await this.redis.del(Key.auth.deviceSession(userId, deviceId));
    await this.redis.srem(Key.auth.userSessions(userId), deviceId);
  }

  // ─── Logout from ALL devices ──────────────────────────────────────────────

  async revokeAllSessions(userId: string): Promise<number> {
    const deviceIds = await this.redis.smembers(Key.auth.userSessions(userId));
    let revoked = 0;

    for (const deviceId of deviceIds) {
      const session = await this.redis.getJson<DeviceSession>(
        Key.auth.deviceSession(userId, deviceId),
      );
      if (session) {
        await this.redis.deleteRefreshToken(session.jti);
        await this.redis.del(Key.auth.deviceSession(userId, deviceId));
        revoked++;
      }
    }

    await this.redis.del(Key.auth.userSessions(userId));
    this.logger.log(`Revoked ${revoked} sessions for user ${userId}`);
    return revoked;
  }

  // ─── Blacklist an access token (for immediate logout) ─────────────────────

  async blacklistAccessToken(jti: string): Promise<void> {
    await this.redis.blacklistToken(jti, TTL.ACCESS_TOKEN_BLACKLIST);
  }

  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    return this.redis.isTokenBlacklisted(jti);
  }
}
