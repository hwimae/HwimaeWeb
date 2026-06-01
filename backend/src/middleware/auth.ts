import type { NextFunction, Request, RequestHandler, Response } from 'express';
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

export function requireAuth<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = unknown,
  Locals extends Record<string, any> = Record<string, any>,
>(deps: Pick<BackendDeps, 'prisma' | 'tokenService'>): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> {
  return async (req: Request<P, ResBody, ReqBody, ReqQuery, Locals>, _res: Response, next: NextFunction) => {
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
