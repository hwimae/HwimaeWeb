import type { RequestHandler } from 'express';
import type { z, ZodTypeAny } from 'zod';

type RouteParams = Record<string, string>;

export function validateBody<TSchema extends ZodTypeAny>(
  schema: TSchema,
): RequestHandler<RouteParams, unknown, z.infer<TSchema>> {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery<TSchema extends ZodTypeAny>(
  schema: TSchema,
): RequestHandler<RouteParams, unknown, unknown, z.infer<TSchema>> {
  return (req, _res, next) => {
    req.query = schema.parse(req.query);
    next();
  };
}

export function validateParams<TSchema extends ZodTypeAny>(schema: TSchema): RequestHandler<z.infer<TSchema>> {
  return (req, _res, next) => {
    req.params = schema.parse(req.params);
    next();
  };
}
