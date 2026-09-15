import { Router } from 'express';
import { authController } from './auth.controller';
import { validateBody } from '../../shared/middleware/validate';
import { authRateLimit, otpRateLimit } from '../../shared/middleware/rateLimit';
import {
  registerSchema,
  loginSchema,
  otpVerifySchema,
  refreshTokenSchema,
} from '@gharkhana/validation';

export const authRouter: Router = Router();

authRouter.post('/register', authRateLimit, validateBody(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

authRouter.post('/login', authRateLimit, validateBody(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

authRouter.post('/otp/verify', otpRateLimit, validateBody(otpVerifySchema), (req, res, next) =>
  authController.verifyOtp(req, res, next)
);

authRouter.post('/refresh', authRateLimit, validateBody(refreshTokenSchema), (req, res, next) =>
  authController.refresh(req, res, next)
);

authRouter.post('/logout', authRateLimit, (req, res, next) =>
  authController.logout(req, res, next)
);

