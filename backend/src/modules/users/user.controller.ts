import type { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';

export class UserController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getMe(req.user!.id);
      res.status(200).json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateMe(req.user!.id, req.body);
      res.status(200).json({ data: user });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();

