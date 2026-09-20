import { Router } from 'express';
import { disputeController } from './dispute.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { createDisputeSchema } from '@gharkhana/validation';

export const disputeRouter: Router = Router();

disputeRouter.use(authenticate);

disputeRouter.post('/', validateBody(createDisputeSchema), (req, res, next) =>
  disputeController.raiseDispute(req, res, next)
);
disputeRouter.get('/mine', (req, res, next) =>
  disputeController.listMyDisputes(req, res, next)
);
