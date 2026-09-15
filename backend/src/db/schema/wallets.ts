import { pgTable, uuid, varchar, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { providers } from './providers';
import { ledgerEntryTypeEnum, ledgerReferenceTypeEnum } from './enums';

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id')
    .notNull()
    .unique()
    .references(() => providers.id, { onDelete: 'cascade' }),
  balance: numeric('balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
  currency: varchar('currency', { length: 3 }).notNull().default('NPR'),
});

export const ledgerEntries = pgTable(
  'ledger_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    type: ledgerEntryTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(), // signed (+credit, -debit)
    referenceType: ledgerReferenceTypeEnum('reference_type').notNull(),
    referenceId: uuid('reference_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('ledger_entries_wallet_created_idx').on(table.walletId, table.createdAt),
  ]
);

