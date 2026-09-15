import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { subscriptions } from './subscriptions';
import { disputeCategoryEnum, disputeStatusEnum } from './enums';

export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  subscriptionId: uuid('subscription_id')
    .notNull()
    .references(() => subscriptions.id),
  raisedByUserId: uuid('raised_by_user_id')
    .notNull()
    .references(() => users.id),
  category: disputeCategoryEnum('category').notNull(),
  status: disputeStatusEnum('status').notNull().default('OPEN'),
  resolutionNote: text('resolution_note'),
  resolvedByAdminId: uuid('resolved_by_admin_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

