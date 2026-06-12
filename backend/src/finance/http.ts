import type { NextFunction, Request } from 'express';
import { unauthorized } from '../errors';

export function getRequiredUserId(req: Request, next: NextFunction): string | undefined {
  if (!req.user) {
    next(unauthorized('Unauthorized'));
    return undefined;
  }

  return req.user.id;
}
