import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { AppConfig } from '../config';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { loginSchema, registerSchema } from './auth.schema';
import * as authService from './auth.service';

export function createAuthRouter(config: AppConfig): Router {
  const router = Router();
  const authLimiter = rateLimit({ windowMs: 60_000, limit: 10 });

  router.post('/register', authLimiter, validateBody(registerSchema), async (req, res, next) => {
    try {
      res.json(await authService.register(config, req.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', authLimiter, validateBody(loginSchema), async (req, res, next) => {
    try {
      res.json(await authService.login(config, req.body));
    } catch (error) {
      next(error);
    }
  });

  router.get('/me', requireAuth(config), (req, res) => {
    res.json(req.user);
  });

  return router;
}
