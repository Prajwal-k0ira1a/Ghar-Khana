import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../shared/middleware/authenticate';

export const userRouter: Router = Router();

userRouter.get('/me', authenticate, (req, res, next) =>
  userController.getMe(req, res, next)
);

userRouter.patch('/me', authenticate, (req, res, next) =>
  userController.updateMe(req, res, next)
);

