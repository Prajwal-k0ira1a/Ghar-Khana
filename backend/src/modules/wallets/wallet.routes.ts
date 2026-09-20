import { Router } from 'express';
import { walletController } from './wallet.controller.js';
import { authenticate, requireRole } from '../../shared/middleware/authenticate.js';
import { validate } from '../../shared/middleware/validate.js';
import { requestPayoutSchema } from '@gharkhana/validation';

export const walletRouter: Router = Router();

walletRouter.use(authenticate, requireRole('PROVIDER'));

walletRouter.get('/wallet', (req, res, next) =>
  walletController.getWallet(req, res, next)
);

walletRouter.post(
  '/payouts',
  validate(requestPayoutSchema),
  (req, res, next) => walletController.requestPayout(req, res, next)
);
