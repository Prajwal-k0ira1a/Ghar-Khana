import type { Request, Response, NextFunction } from 'express';
import { disputeService } from './dispute.service.js';

export class DisputeController {
  async raiseDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await disputeService.raiseDispute(req.user!.id, req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async listMyDisputes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await disputeService.listMyDisputes(req.user!.id);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }
}

export const disputeController = new DisputeController();
