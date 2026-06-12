import { Router } from 'express';
import type { BackendDeps } from '../../dependencies';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { financeSessionIdParamSchema } from '../finance.schema';
import { createFinanceChatController } from './chat.controller';
import { createFinanceChatService } from './chat.service';
import { sendFinanceChatMessageSchema, startFinanceChatSchema } from './chat.schema';

export function createFinanceChatRouter(deps: BackendDeps): Router {
  const router = Router();
  const controller = createFinanceChatController(createFinanceChatService({
    prisma: deps.prisma,
    financeAiClient: deps.financeAiClient,
  }));

  router.use(requireAuth(deps));
  router.post('/start', validateBody(startFinanceChatSchema), controller.start);
  router.post('/:sessionId/message', validateParams(financeSessionIdParamSchema), validateBody(sendFinanceChatMessageSchema), controller.sendMessage);
  router.get('/:sessionId/history', validateParams(financeSessionIdParamSchema), controller.history);
  router.post('/:sessionId/close', validateParams(financeSessionIdParamSchema), controller.close);

  return router;
}
