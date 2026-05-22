import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import { createAuthRouter } from './auth/auth.router';
import type { AppConfig } from './config';
import type { BackendDeps } from './dependencies';
import { createErrorHandler, notFound } from './errors';
import { createMoviesRouter } from './movies/movies.router';
import { createRatingsRouter } from './ratings/ratings.router';

export function createApp(config: AppConfig, deps: BackendDeps): Express {
  const app = express();

  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json());
  app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

  app.use('/auth', createAuthRouter(deps));
  app.use('/movies', createMoviesRouter(deps));
  app.use('/ratings', createRatingsRouter(deps));

  app.use((_req, _res, next) => {
    next(notFound('Not found'));
  });
  app.use(createErrorHandler(deps.logger));

  return app;
}
