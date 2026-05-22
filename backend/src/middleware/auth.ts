import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthUser } from '../auth/auth.schema';
import type { AppConfig } from '../config';
import { unauthorized } from '../errors';
import { prisma } from '../prisma';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

type JwtPayload = {
  sub: string;
  email: string;
};

export function requireAuth(config: AppConfig) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.header('authorization');
      const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
      if (!token) {
        throw unauthorized('Unauthorized');
      }

      const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as JwtPayload;
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw unauthorized('Unauthorized');
      }

      req.user = { id: user.id, email: user.email, name: user.name };
      next();
    } catch {
      next(unauthorized('Unauthorized'));
    }
  };
}
