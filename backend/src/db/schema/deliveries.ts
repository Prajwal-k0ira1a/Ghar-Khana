import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { mealOccurrences } from './mealOccurrences';
import { users } from './users';
import { deliveryStatusEnum, deliveryFailureReasonEnum, proofTypeEnum } from './enums';

export const deliveries = pgTable('deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealOccurrenceId: uuid('meal_occurrence_id')
    .notNull()
    .unique()
    .references(() => mealOccurrences.id, { onDelete: 'cascade' }),
  deliveryPartnerId: uuid('delivery_partner_id').references(() => users.id),
  status: deliveryStatusEnum('status').notNull().default('PENDING'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  pickedUpAt: timestamp('picked_up_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  failureReason: deliveryFailureReasonEnum('failure_reason'),
  deliveryNotes: text('delivery_notes'),
  proofType: proofTypeEnum('proof_type'),
});

