import { pgTable, uuid, date, numeric, integer, smallint, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { providers, cutoffPolicies } from './providers';
import { customerLocations } from './locations';
import { menuItems } from './menus';
import { frequencyEnum, mealTypeEnum, subscriptionStatusEnum } from './enums';

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => providers.id),
    locationId: uuid('location_id')
      .notNull()
      .references(() => customerLocations.id),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    frequency: frequencyEnum('frequency').notNull(),
    mealType: mealTypeEnum('meal_type').notNull(),
    quantity: integer('quantity').notNull().default(1),
    status: subscriptionStatusEnum('status').notNull().default('DRAFT'),
    totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
    cutoffPolicyId: uuid('cutoff_policy_id').references(() => cutoffPolicies.id),
    promoRedemptionId: uuid('promo_redemption_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('subscriptions_customer_id_idx').on(table.customerId),
    index('subscriptions_provider_id_idx').on(table.providerId),
    index('subscriptions_status_idx').on(table.status),
  ]
);

export const subscriptionSchedules = pgTable(
  'subscription_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscriptions.id, { onDelete: 'cascade' }),
    dayOfWeek: smallint('day_of_week').notNull(), // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    defaultMenuItemId: uuid('default_menu_item_id')
      .notNull()
      .references(() => menuItems.id),
    quantity: integer('quantity').notNull().default(1),
  },
  (table) => [
    uniqueIndex('subscription_schedules_sub_dow_idx').on(table.subscriptionId, table.dayOfWeek),
  ]
);

