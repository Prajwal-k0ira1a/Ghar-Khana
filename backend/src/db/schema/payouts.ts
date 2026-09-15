import { pgTable, uuid, varchar, numeric, date, timestamp } from 'drizzle-orm/pg-core';
import { providers } from './providers';
import { payoutStatusEnum } from './enums';

export const providerPayouts = pgTable('provider_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id')
    .notNull()
    .references(() => providers.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status: payoutStatusEnum('status').notNull().default('SCHEDULED'),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  payoutReference: varchar('payout_reference', { length: 255 }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

