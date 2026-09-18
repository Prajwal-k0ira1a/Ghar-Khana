import type { Request, Response, NextFunction } from 'express';
import { providerService } from './provider.service.js';
import type { MealType } from '@gharkhana/types';

export class ProviderController {
  async listProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
      const mealType = req.query.mealType as MealType | undefined;
      const dietaryTag = req.query.dietaryTag as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;

      const result = await providerService.listProviders({
        lat,
        lng,
        mealType,
        dietaryTag,
        page,
        pageSize,
      });

      res.status(200).json({
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getProviderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderById(req.params.id);
      res.status(200).json({ data: provider });
    } catch (err) {
      next(err);
    }
  }

  async getMyProviderProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      res.status(200).json({ data: provider });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await providerService.updateProfile(
        req.params.id,
        req.user!.id,
        req.body
      );
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async submitVerificationDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await providerService.submitVerificationDocument(
        req.params.id,
        req.user!.id,
        req.body
      );
      res.status(201).json({ data: doc });
    } catch (err) {
      next(err);
    }
  }

  async addServiceArea(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const area = await providerService.addServiceArea(
        req.params.id,
        req.user!.id,
        req.body
      );
      res.status(201).json({ data: area });
    } catch (err) {
      next(err);
    }
  }

  async updateServiceArea(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const area = await providerService.updateServiceArea(
        req.params.id,
        req.user!.id,
        req.params.areaId,
        req.body
      );
      res.status(200).json({ data: area });
    } catch (err) {
      next(err);
    }
  }

  async deleteServiceArea(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await providerService.deleteServiceArea(
        req.params.id,
        req.user!.id,
        req.params.areaId
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateCutoffPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await providerService.updateCutoffPolicy(
        req.params.id,
        req.user!.id,
        req.body
      );
      res.status(200).json({ data: policy });
    } catch (err) {
      next(err);
    }
  }
}

export const providerController = new ProviderController();
