import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import type { Logger } from './dependencies';

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export const badRequest = (message: string): HttpError => new HttpError(400, message);
export const unauthorized = (message: string): HttpError => new HttpError(401, message);
export const notFound = (message: string): HttpError => new HttpError(404, message);
export const conflict = (message: string): HttpError => new HttpError(409, message);
export const badGateway = (message: string): HttpError => new HttpError(502, message);

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error, _req, res, _next) => {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Validation failed', issues: error.issues });
      return;
    }

    logger.error(error);
    res.status(500).json({ message: 'Internal server error' });
  };
}
