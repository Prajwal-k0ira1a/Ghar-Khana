import type { Request, Response, NextFunction } from 'express';
import { subscriptionService } from './subscription.service.js';

export class SubscriptionController {
  async listSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await subscriptionService.listCustomerSubscriptions(req.user!.id);
      res.status(200).json({ data: list });
    } catch (err) {
      next(err);
    }
  }

  async getSubscriptionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sub = await subscriptionService.getSubscriptionById(req.params.id, req.user!.id);
      res.status(200).json({ data: sub });
    } catch (err) {
      next(err);
    }
  }

  async createSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await subscriptionService.createSubscription(req.user!.id, req.body);
      res.status(201).json({ data: created });
    } catch (err) {
      next(err);
    }
  }

  async activateSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await subscriptionService.activateSubscription(req.params.id, req.user!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async pauseSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await subscriptionService.pauseSubscription(req.params.id, req.user!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async resumeSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await subscriptionService.resumeSubscription(req.params.id, req.user!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await subscriptionService.cancelSubscription(req.params.id, req.user!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const subscriptionController = new SubscriptionController();
