import type { NextFunction, Request, Response } from 'express';
import type { AuthUser } from '../auth/auth.schema';
import type { BackendDeps } from '../dependencies';
import { unauthorized } from '../errors';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(deps: Pick<BackendDeps, 'prisma' | 'tokenService'>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.header('authorization');
      const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
      if (!token) {
        throw unauthorized('Unauthorized');
      }

      const payload = deps.tokenService.verifyAccessToken(token);
      const user = await deps.prisma.user.findUnique({ where: { id: payload.sub } });
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
