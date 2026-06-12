import { Router } from 'express';
import type { BackendDeps } from '../../dependencies';
import { requireAuth } from '../../middleware/auth';
import { createFinanceSpendingController } from './spending.controller';
import { createFinanceSpendingService } from './spending.service';

export function createFinanceSpendingRouter(deps: BackendDeps): Router {
  const router = Router();
  const controller = createFinanceSpendingController(createFinanceSpendingService(deps));

  router.use(requireAuth(deps));
  router.get('/summary', controller.summary);

  return router;
}
