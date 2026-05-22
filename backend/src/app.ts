import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import { createAuthRouter } from './auth/auth.router';
import type { AppConfig } from './config';
import { errorHandler, notFound } from './errors';
import { createMoviesRouter } from './movies/movies.router';
import { createRatingsRouter } from './ratings/ratings.router';

export function createApp(config: AppConfig): Express {
  const app = express();

  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json());
  app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

  app.use('/auth', createAuthRouter(config));
  app.use('/movies', createMoviesRouter());
  app.use('/ratings', createRatingsRouter(config));

  app.use((_req, _res, next) => {
    next(notFound('Not found'));
  });
  app.use(errorHandler);

  return app;
}
