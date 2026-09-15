import type { Request, Response, NextFunction } from 'express';
import { type ZodTypeAny, ZodError } from 'zod';
import { ValidationError } from '../errors/AppError';

export const validateBody = (schema: ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.');
          details[path] = issue.message;
        }
        next(new ValidationError('Request validation failed', details));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.');
          details[path] = issue.message;
        }
        next(new ValidationError('Query validation failed', details));
      } else {
        next(error);
      }
    }
  };
};

export const validate = validateBody;


