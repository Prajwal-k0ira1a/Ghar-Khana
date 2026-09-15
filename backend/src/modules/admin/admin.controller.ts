import type { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';

export class AdminController {
  async listPendingProviders(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pending = await adminService.listPendingProviders();
      res.status(200).json({ data: pending });
    } catch (err) {
      next(err);
    }
  }

  async verifyProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const verified = await adminService.verifyProvider(req.user!.id, req.params.id);
      res.status(200).json({ data: verified });
    } catch (err) {
      next(err);
    }
  }

  async rejectProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rejected = await adminService.rejectProvider(
        req.user!.id,
        req.params.id,
        req.body
      );
      res.status(200).json({ data: rejected });
    } catch (err) {
      next(err);
    }
  }

  async listDisputes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.listDisputes(req.query.status as string | undefined);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async updateDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.updateDispute(req.user!.id, req.params.id, req.body);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async refundSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.refundSubscription(req.user!.id, req.params.id, req.body);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
