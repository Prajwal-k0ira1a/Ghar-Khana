import { pgTable, uuid, varchar, text, numeric, boolean, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { providers } from './providers';
import { menuStatusEnum, mealTypeEnum } from './enums';

export const menus = pgTable('menus', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description'),
  status: menuStatusEnum('status').notNull().default('DRAFT'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    menuId: uuid('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    description: text('description'),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    mealType: mealTypeEnum('meal_type').notNull(),
    availability: boolean('availability').notNull().default(true),
    dietaryTags: jsonb('dietary_tags').$type<string[]>().notNull().default([]),
    imageUrl: varchar('image_url', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('menu_items_menu_meal_avail_idx').on(table.menuId, table.mealType, table.availability),
  ]
);

