import type { Request, Response, NextFunction } from 'express';
import { reviewService } from './review.service.js';

export class ReviewController {
  async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reviewService.createReview(req.user!.id, req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async listProviderReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reviewService.listProviderReviews(req.params.providerId);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async moderateReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reviewService.moderateReview(
        req.user!.id,
        req.params.id,
        req.body.status
      );
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }
}

export const reviewController = new ReviewController();
