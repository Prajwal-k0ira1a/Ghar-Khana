import type { Request, Response, NextFunction } from 'express';
import { deliveryService } from './delivery.service.js';

export class DeliveryController {
  async listDeliveries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await deliveryService.listDeliveries(req.user!.id, req.user!.role, {
        status: req.query.status as string | undefined,
        date: req.query.date as string | undefined,
      });
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getDeliveryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await deliveryService.getDeliveryById(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async acceptDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await deliveryService.acceptDelivery(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body ?? {}
      );
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async markPickedUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await deliveryService.markPickedUp(req.params.id, req.user!.id, req.user!.role);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async markDelivered(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await deliveryService.markDelivered(req.params.id, req.user!.id, req.user!.role);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async markFailed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await deliveryService.markFailed(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body
      );
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async cancelDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await deliveryService.cancelDelivery(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }
}

export const deliveryController = new DeliveryController();
