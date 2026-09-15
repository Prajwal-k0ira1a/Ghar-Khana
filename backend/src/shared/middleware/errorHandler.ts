import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../logger/logger';
import { env } from '../config/env';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn({
      err: {
        name: err.name,
        message: err.message,
        code: err.code,
        details: err.details,
      },
      path: req.path,
      method: req.method,
    }, 'Operational AppError handled');

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  logger.error({
    err,
    path: req.path,
    method: req.method,
  }, 'Unhandled internal error');

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message || 'An unexpected error occurred',
    },
  });
};

