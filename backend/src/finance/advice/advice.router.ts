import { Router } from 'express';
import type { BackendDeps } from '../../dependencies';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createFinanceAdviceController } from './advice.controller';
import { createFinanceAdviceService } from './advice.service';
import { financeAdviceRequestSchema } from './advice.schema';

export function createFinanceAdviceRouter(deps: BackendDeps): Router {
  const router = Router();
  const controller = createFinanceAdviceController(createFinanceAdviceService({
    prisma: deps.prisma,
    financeAiClient: deps.financeAiClient,
  }));

  router.use(requireAuth(deps));
  router.post('/', validateBody(financeAdviceRequestSchema), controller.generate);

  return router;
}
