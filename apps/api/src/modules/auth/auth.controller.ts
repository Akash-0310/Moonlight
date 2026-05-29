import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser, RefreshRequestWithUser } from '../../common/types';

const REFRESH_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: RefreshRequestWithUser, @Res({ passthrough: true }) res: Response) {
    const { id, jti } = req.user;
    const tokens = await this.authService.refresh(id, jti);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: RefreshRequestWithUser, @Res({ passthrough: true }) res: Response) {
    // Best-effort: invalidate token if present, clear cookie regardless
    const refreshToken = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
    if (refreshToken) {
      try {
        const payload = this.extractJtiFromToken(refreshToken);
        if (payload) await this.authService.logout(payload);
      } catch {
        // Token may be already expired — still clear the cookie
      }
    }
    res.clearCookie(REFRESH_COOKIE, this.getCookieOptions());
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Password updated successfully. You can now sign in.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user);
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, this.getCookieOptions());
  }

  private getCookieOptions() {
    const isProduction = this.config.get<string>('nodeEnv') === 'production';
    return {
      httpOnly: true,         // JS cannot read this cookie — prevents XSS token theft
      secure: isProduction,   // HTTPS only in production
      sameSite: 'strict' as const, // CSRF protection
      path: '/api/auth',      // Cookie sent only to /api/auth/* routes
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    };
  }

  private extractJtiFromToken(token: string): string | null {
    try {
      // Decode without verification — we just need the jti to delete from Redis
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as { jti?: string };
      return payload.jti ?? null;
    } catch {
      return null;
    }
  }
}
