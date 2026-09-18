import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { menus, menuItems } from '../../db/schema/index.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import type {
  CreateMenuInput,
  UpdateMenuInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
} from '@gharkhana/validation';

export class MenuService {
  async getProviderMenus(providerId: string, includeAll = false) {
    const conditions = [eq(menus.providerId, providerId)];
    if (!includeAll) {
      conditions.push(eq(menus.status, 'PUBLISHED'));
    }

    return db.query.menus.findMany({
      where: and(...conditions),
      with: {
        items: {
          where: includeAll ? undefined : eq(menuItems.availability, true),
        },
      },
    });
  }

  async getMenuById(menuId: string, includeUnavailable = false) {
    const menu = await db.query.menus.findFirst({
      where: eq(menus.id, menuId),
      with: {
        items: {
          where: includeUnavailable ? undefined : eq(menuItems.availability, true),
        },
      },
    });

    if (!menu) {
      throw new NotFoundError('Menu not found', 'MENU_NOT_FOUND');
    }

    return menu;
  }

  async getMenuItems(menuId: string, includeUnavailable = false) {
    await this.getMenuById(menuId, includeUnavailable);
    const conditions = [eq(menuItems.menuId, menuId)];
    if (!includeUnavailable) {
      conditions.push(eq(menuItems.availability, true));
    }

    return db.query.menuItems.findMany({
      where: and(...conditions),
    });
  }

  async getMenuItemById(itemId: string) {
    const item = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, itemId),
    });

    if (!item) {
      throw new NotFoundError('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    }

    return item;
  }

  async createMenu(providerId: string, input: CreateMenuInput) {
    const [created] = await db
      .insert(menus)
      .values({
        providerId,
        name: input.name,
        description: input.description,
        status: input.status || 'DRAFT',
      })
      .returning();

    return created;
  }

  async updateMenu(menuId: string, providerId: string, input: UpdateMenuInput) {
    const menu = await db.query.menus.findFirst({
      where: and(eq(menus.id, menuId), eq(menus.providerId, providerId)),
    });

    if (!menu) {
      throw new NotFoundError('Menu not found or not owned by provider', 'MENU_NOT_FOUND');
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status) updateData.status = input.status;

    const [updated] = await db
      .update(menus)
      .set(updateData)
      .where(eq(menus.id, menuId))
      .returning();

    return updated;
  }

  async deleteMenu(menuId: string, providerId: string) {
    const menu = await db.query.menus.findFirst({
      where: and(eq(menus.id, menuId), eq(menus.providerId, providerId)),
    });

    if (!menu) {
      throw new NotFoundError('Menu not found or not owned by provider', 'MENU_NOT_FOUND');
    }

    await db.delete(menus).where(eq(menus.id, menuId));
    return { success: true };
  }

  async createMenuItem(providerId: string, input: CreateMenuItemInput) {
    // Validate menu belongs to provider
    const menu = await db.query.menus.findFirst({
      where: and(eq(menus.id, input.menuId), eq(menus.providerId, providerId)),
    });

    if (!menu) {
      throw new NotFoundError('Menu not found or not owned by provider', 'MENU_NOT_FOUND');
    }

    const [created] = await db
      .insert(menuItems)
      .values({
        menuId: input.menuId,
        name: input.name,
        description: input.description,
        price: input.price,
        mealType: input.mealType,
        availability: input.availability ?? true,
        dietaryTags: input.dietaryTags || [],
        imageUrl: input.imageUrl,
      })
      .returning();

    return created;
  }

  async updateMenuItem(itemId: string, providerId: string, input: UpdateMenuItemInput) {
    const item = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, itemId),
      with: {
        menu: true,
      },
    });

    if (!item || item.menu.providerId !== providerId) {
      throw new NotFoundError('Menu item not found or not owned by provider', 'MENU_ITEM_NOT_FOUND');
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.price) updateData.price = input.price;
    if (input.mealType) updateData.mealType = input.mealType;
    if (input.availability !== undefined) updateData.availability = input.availability;
    if (input.dietaryTags) updateData.dietaryTags = input.dietaryTags;
    if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;

    const [updated] = await db
      .update(menuItems)
      .set(updateData)
      .where(eq(menuItems.id, itemId))
      .returning();

    return updated;
  }

  async toggleItemAvailability(itemId: string, providerId: string, availability: boolean) {
    return this.updateMenuItem(itemId, providerId, { availability });
  }

  async deleteMenuItem(itemId: string, providerId: string) {
    const item = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, itemId),
      with: {
        menu: true,
      },
    });

    if (!item || item.menu.providerId !== providerId) {
      throw new NotFoundError('Menu item not found or not owned by provider', 'MENU_ITEM_NOT_FOUND');
    }

    await db.delete(menuItems).where(eq(menuItems.id, itemId));
    return { success: true };
  }
}

export const menuService = new MenuService();

