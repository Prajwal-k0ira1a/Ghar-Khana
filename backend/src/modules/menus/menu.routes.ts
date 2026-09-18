import { Router } from 'express';
import { menuController } from './menu.controller.js';
import { authenticate, requireRole } from '../../shared/middleware/authenticate.js';
import { validate } from '../../shared/middleware/validate.js';
import {
  createMenuSchema,
  updateMenuSchema,
  createMenuItemSchema,
  updateMenuItemSchema,
} from '@gharkhana/validation';

export const menuRouter: Router = Router();

// Public menu browsing routes
menuRouter.get('/provider/:providerId', (req, res, next) =>
  menuController.getProviderMenus(req, res, next)
);

menuRouter.get('/:id', (req, res, next) =>
  menuController.getMenuById(req, res, next)
);

menuRouter.get('/:id/items', (req, res, next) =>
  menuController.getMenuItems(req, res, next)
);

menuRouter.get('/items/:id', (req, res, next) =>
  menuController.getMenuItemById(req, res, next)
);

// Protected provider menu management routes
menuRouter.post(
  '/',
  authenticate,
  requireRole('PROVIDER'),
  validate(createMenuSchema),
  (req, res, next) => menuController.createMenu(req, res, next)
);

menuRouter.patch(
  '/:id',
  authenticate,
  requireRole('PROVIDER'),
  validate(updateMenuSchema),
  (req, res, next) => menuController.updateMenu(req, res, next)
);

menuRouter.delete(
  '/:id',
  authenticate,
  requireRole('PROVIDER'),
  (req, res, next) => menuController.deleteMenu(req, res, next)
);

// Menu Items CRUD
menuRouter.post(
  '/items',
  authenticate,
  requireRole('PROVIDER'),
  validate(createMenuItemSchema),
  (req, res, next) => menuController.createMenuItem(req, res, next)
);

menuRouter.patch(
  '/items/:id',
  authenticate,
  requireRole('PROVIDER'),
  validate(updateMenuItemSchema),
  (req, res, next) => menuController.updateMenuItem(req, res, next)
);

menuRouter.patch(
  '/items/:id/availability',
  authenticate,
  requireRole('PROVIDER'),
  (req, res, next) => menuController.toggleItemAvailability(req, res, next)
);

menuRouter.delete(
  '/items/:id',
  authenticate,
  requireRole('PROVIDER'),
  (req, res, next) => menuController.deleteMenuItem(req, res, next)
);

