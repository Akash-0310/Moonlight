import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser, JwtPayload, JwtRefreshPayload } from '../../common/types';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@prisma/client';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult extends TokenPair {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
}

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
      select: { id: true, email: true, name: true, role: true },
    });

    this.logger.log(`New user registered: ${user.email}`);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { ...tokens, user };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, name: true, role: true, passwordHash: true },
    });

    // Constant-time comparison — run bcrypt even if user not found to prevent timing attacks
    const dummyHash = '$2b$12$invalidhashfortimingattackprevention00000000000000000';
    const isMatch = await bcrypt.compare(dto.password, user?.passwordHash ?? dummyHash);

    if (!user || !isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async refresh(userId: string, oldJti: string): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
    if (!user) throw new UnauthorizedException('User not found');

    // Invalidate old refresh token (token rotation — stolen token detection)
    await this.redis.deleteRefreshToken(oldJti);

    return this.generateTokens(user.id, user.email, user.role);
  }

  async logout(jti: string): Promise<void> {
    await this.redis.deleteRefreshToken(jti);
  }

  async getProfile(user: AuthenticatedUser) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  }

  async forgotPassword(email: string): Promise<{ message: string; resetUrl?: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always respond with success to prevent email enumeration
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    // Delete any existing tokens for this user
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const frontendUrl = this.config.get<string>('frontendUrl') ?? 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    if (this.config.get<string>('nodeEnv') === 'development') {
      this.logger.log(`\n🔑 PASSWORD RESET LINK for ${email}:\n${resetUrl}\n`);
      // In development return the URL directly so it can be used without email
      return {
        message: 'Reset link generated. Check server console for the link.',
        resetUrl,
      };
    }

    // Production: send email via nodemailer
    // await this.mailService.sendPasswordReset(email, resetUrl);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Reset link is invalid or has expired. Please request a new one.');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.delete({ where: { tokenHash } }),
    ]);

    this.logger.log(`Password reset successful for: ${record.user.email}`);
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private async generateTokens(userId: string, email: string, role: Role): Promise<TokenPair> {
    const jti = uuidv4();
    const refreshTtl = this.config.get<number>('jwt.refreshExpirySeconds') as number;

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(userId, email, role),
      this.signRefreshToken(userId, jti),
    ]);

    // Whitelist the new refresh token in Redis
    await this.redis.setRefreshToken(jti, userId, refreshTtl);

    return { accessToken, refreshToken };
  }

  private signAccessToken(userId: string, email: string, role: Role): Promise<string> {
    const payload: JwtPayload = { sub: userId, email, role };
    return this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessExpiry'),
    });
  }

  private signRefreshToken(userId: string, jti: string): Promise<string> {
    const payload: JwtRefreshPayload = { sub: userId, jti };
    return this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshExpiry'),
    });
  }
}
