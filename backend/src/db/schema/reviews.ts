import { pgTable, uuid, smallint, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { providers } from './providers';
import { subscriptions } from './subscriptions';
import { reviewStatusEnum } from './enums';

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => users.id),
  providerId: uuid('provider_id')
    .notNull()
    .references(() => providers.id),
  subscriptionId: uuid('subscription_id')
    .notNull()
    .unique()
    .references(() => subscriptions.id),
  rating: smallint('rating').notNull(),
  comment: text('comment'),
  status: reviewStatusEnum('status').notNull().default('PUBLISHED'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

