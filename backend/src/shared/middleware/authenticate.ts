import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';
import { env } from '../config/env';
import { db } from '../../db/index';
import { users } from '../../db/schema/index';
import { eq } from 'drizzle-orm';
import type { UserRole } from '@gharkhana/types';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface JwtPayload {
  sub: string;
  role: UserRole;
  email?: string;
  phone?: string;
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header', 'TOKEN_MISSING'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    
    // Verify user exists and is active
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!userRecord || userRecord.status !== 'ACTIVE') {
      return next(new UnauthorizedError('User account not found or inactive', 'ACCOUNT_INACTIVE'));
    }

    req.user = {
      id: userRecord.id,
      role: userRecord.role as UserRole,
      email: userRecord.email,
      phone: userRecord.phone,
      name: userRecord.name,
    };

    next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Access token expired', 'TOKEN_EXPIRED'));
    }
    return next(new UnauthorizedError('Invalid access token', 'TOKEN_INVALID'));
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Action requires one of the following roles: ${allowedRoles.join(', ')}`,
          'FORBIDDEN_ROLE'
        )
      );
    }

    next();
  };
};

