import { pgTable, uuid, date, numeric, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { subscriptions } from './subscriptions';
import { providers } from './providers';
import { menuItems } from './menus';
import { occurrenceStatusEnum, customizationSourceEnum } from './enums';

export const mealOccurrences = pgTable(
  'meal_occurrences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscriptions.id, { onDelete: 'cascade' }),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => providers.id),
    scheduledDate: date('scheduled_date').notNull(),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
    status: occurrenceStatusEnum('status').notNull().default('SCHEDULED'),
    customizationSource: customizationSourceEnum('customization_source')
      .notNull()
      .default('DEFAULT'),
    cutoffAt: timestamp('cutoff_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('meal_occurrences_sub_date_idx').on(table.subscriptionId, table.scheduledDate),
    index('meal_occurrences_sub_id_idx').on(table.subscriptionId),
    index('meal_occurrences_date_idx').on(table.scheduledDate),
    index('meal_occurrences_status_idx').on(table.status),
    index('meal_occurrences_provider_date_idx').on(table.providerId, table.scheduledDate),
  ]
);

