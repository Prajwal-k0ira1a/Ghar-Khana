import type { Request, Response, NextFunction } from 'express';
import { menuService } from './menu.service.js';
import { providerService } from '../providers/provider.service.js';

export class MenuController {
  async getProviderMenus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeAll = req.query.includeAll === 'true';
      const menus = await menuService.getProviderMenus(req.params.providerId, includeAll);
      res.status(200).json({ data: menus });
    } catch (err) {
      next(err);
    }
  }

  async getMenuById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeUnavailable = req.query.includeUnavailable === 'true';
      const menu = await menuService.getMenuById(req.params.id, includeUnavailable);
      res.status(200).json({ data: menu });
    } catch (err) {
      next(err);
    }
  }

  async getMenuItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeUnavailable = req.query.includeUnavailable === 'true';
      const items = await menuService.getMenuItems(req.params.id, includeUnavailable);
      res.status(200).json({ data: items });
    } catch (err) {
      next(err);
    }
  }

  async getMenuItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await menuService.getMenuItemById(req.params.id);
      res.status(200).json({ data: item });
    } catch (err) {
      next(err);
    }
  }

  async createMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const menu = await menuService.createMenu(provider.id, req.body);
      res.status(201).json({ data: menu });
    } catch (err) {
      next(err);
    }
  }

  async updateMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const updated = await menuService.updateMenu(req.params.id, provider.id, req.body);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const result = await menuService.deleteMenu(req.params.id, provider.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async createMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const item = await menuService.createMenuItem(provider.id, req.body);
      res.status(201).json({ data: item });
    } catch (err) {
      next(err);
    }
  }

  async updateMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const updated = await menuService.updateMenuItem(req.params.id, provider.id, req.body);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async toggleItemAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const updated = await menuService.toggleItemAvailability(
        req.params.id,
        provider.id,
        req.body.availability
      );
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const result = await menuService.deleteMenuItem(req.params.id, provider.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const menuController = new MenuController();

