import { pgTable, uuid, varchar, numeric, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { subscriptions } from './subscriptions';
import { users } from './users';
import { paymentGatewayEnum, paymentStatusEnum } from './enums';

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscriptions.id),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('NPR'),
    gateway: paymentGatewayEnum('gateway').notNull(),
    providerReference: varchar('provider_reference', { length: 255 }),
    status: paymentStatusEnum('status').notNull().default('PENDING'),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull().unique(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('payments_idempotency_key_idx').on(table.idempotencyKey),
    index('payments_subscription_id_idx').on(table.subscriptionId),
    index('payments_customer_id_idx').on(table.customerId),
    index('payments_status_idx').on(table.status),
  ]
);

