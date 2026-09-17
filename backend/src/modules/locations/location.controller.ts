import type { Request, Response, NextFunction } from 'express';
import { locationService } from './location.service.js';

export class LocationController {
  async listLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const locations = await locationService.listLocations(req.user!.id);
      res.status(200).json({ data: locations });
    } catch (err) {
      next(err);
    }
  }

  async createLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await locationService.createLocation(req.user!.id, req.body);
      res.status(201).json({ data: created });
    } catch (err) {
      next(err);
    }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await locationService.updateLocation(
        req.params.id,
        req.user!.id,
        req.body
      );
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await locationService.deleteLocation(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async checkServiceability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { providerId } = req.query;
      const result = await locationService.isLocationServiceableByProvider(
        req.params.id,
        providerId as string
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const locationController = new LocationController();
