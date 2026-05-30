import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AiAssistantService } from './ai-assistant.service';
import { ChatRequestDto } from './dto/chat.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('ai-assistant')
export class AiAssistantController {
  constructor(
    private readonly aiAssistant: AiAssistantService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('chat')
  chat(
    @Body() dto: ChatRequestDto,
    @Req() req: Request,
  ) {
    // Manually verify JWT if present — allows optional auth on a public route.
    // Authenticated users get order access; guests get product search only.
    const userId = this.extractUserId(req);
    return this.aiAssistant.chat(dto.message, dto.sessionId, userId);
  }

  private extractUserId(req: Request): string | undefined {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return undefined;
    try {
      const payload = this.jwt.verify<{ sub: string }>(
        auth.slice(7),
        { secret: this.config.get<string>('jwt.accessSecret') },
      );
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
