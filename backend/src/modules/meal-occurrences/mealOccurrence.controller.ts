import type { Request, Response, NextFunction } from 'express';
import { mealOccurrenceService } from './mealOccurrence.service.js';

export class MealOccurrenceController {
  async getSubscriptionMeals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fromDate = req.query.from as string | undefined;
      const toDate = req.query.to as string | undefined;
      const meals = await mealOccurrenceService.getSubscriptionMeals(
        req.params.id,
        req.user!.id,
        fromDate,
        toDate
      );
      res.status(200).json({ data: meals });
    } catch (err) {
      next(err);
    }
  }

  async getMealById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meal = await mealOccurrenceService.getMealById(req.params.id, req.user!.id);
      res.status(200).json({ data: meal });
    } catch (err) {
      next(err);
    }
  }

  async customizeMeal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await mealOccurrenceService.customizeMeal(
        req.params.id,
        req.user!.id,
        req.body
      );
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async skipMeal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skipped = await mealOccurrenceService.skipMeal(req.params.id, req.user!.id);
      res.status(200).json({ data: skipped });
    } catch (err) {
      next(err);
    }
  }

  async restoreMeal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const restored = await mealOccurrenceService.restoreMeal(req.params.id, req.user!.id);
      res.status(200).json({ data: restored });
    } catch (err) {
      next(err);
    }
  }
}

export const mealOccurrenceController = new MealOccurrenceController();
