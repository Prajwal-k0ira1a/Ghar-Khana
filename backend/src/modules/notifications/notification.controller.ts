import type { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service.js';

export class NotificationController {
  async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await notificationService.listNotifications(
        req.user!.id,
        req.query.unreadOnly === 'true'
      );
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await notificationService.markRead(req.params.id, req.user!.id);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await notificationService.markAllRead(req.user!.id);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async registerDeviceToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await notificationService.registerDeviceToken(req.user!.id, req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
