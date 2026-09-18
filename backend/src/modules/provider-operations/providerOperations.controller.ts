import type { Request, Response, NextFunction } from 'express';
import { providerOperationsService } from './providerOperations.service.js';
import { providerService } from '../providers/provider.service.js';

export class ProviderOperationsController {
  async getTodayMeals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const dateStr = req.query.date as string | undefined;
      const summary = await providerOperationsService.getTodayPreparationSummary(
        provider.id,
        dateStr
      );
      res.status(200).json({ data: summary });
    } catch (err) {
      next(err);
    }
  }

  async getUpcomingMeals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
      const forecast = await providerOperationsService.getUpcomingPreparationForecast(
        provider.id,
        days
      );
      res.status(200).json({ data: forecast });
    } catch (err) {
      next(err);
    }
  }

  async updateMealStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const updated = await providerOperationsService.updateMealPreparationStatus(
        provider.id,
        req.params.id,
        req.body
      );
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getSubscribers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const subscribers = await providerOperationsService.getProviderSubscribers(provider.id);
      res.status(200).json({ data: subscribers });
    } catch (err) {
      next(err);
    }
  }

  async getEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const earnings = await providerOperationsService.getProviderEarningsSummary(
        provider.id,
        from,
        to
      );
      res.status(200).json({ data: earnings });
    } catch (err) {
      next(err);
    }
  }
}

export const providerOperationsController = new ProviderOperationsController();
