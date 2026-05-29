import { Request } from 'express';
import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

export interface RefreshRequestWithUser extends Request {
  user: {
    id: string;
    jti: string;
  };
}
