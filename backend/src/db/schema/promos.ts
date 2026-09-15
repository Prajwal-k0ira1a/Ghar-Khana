import { pgTable, uuid, varchar, numeric, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { subscriptions } from './subscriptions';
import { discountTypeEnum } from './enums';

export const promoCodes = pgTable('promo_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 30 }).notNull().unique(),
  discountType: discountTypeEnum('discount_type').notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  maxRedemptions: integer('max_redemptions'),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validTo: timestamp('valid_to', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
});

export const promoRedemptions = pgTable('promo_redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  promoCodeId: uuid('promo_code_id')
    .notNull()
    .references(() => promoCodes.id),
  subscriptionId: uuid('subscription_id')
    .notNull()
    .references(() => subscriptions.id),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => users.id),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull(),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }).notNull().defaultNow(),
});

