import { pgTable, uuid, varchar, text, jsonb, numeric, integer, boolean, timestamp, time } from 'drizzle-orm/pg-core';
import { users } from './users';
import {
  providerTypeEnum,
  verificationStatusEnum,
  providerStatusEnum,
  documentTypeEnum,
  mealTypeEnum,
} from './enums';

export const providers = pgTable('providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  providerType: providerTypeEnum('provider_type').notNull().default('HOME_COOK'),
  displayName: varchar('display_name', { length: 120 }).notNull(),
  description: text('description'),
  verificationStatus: verificationStatusEnum('verification_status')
    .notNull()
    .default('PENDING'),
  dailyCapacity: jsonb('daily_capacity')
    .$type<Record<string, number>>()
    .notNull()
    .default({ BREAKFAST: 0, LUNCH: 30, DINNER: 20, SNACKS: 0 }),
  rating: numeric('rating', { precision: 2, scale: 1 }),
  ratingCount: integer('rating_count').notNull().default(0),
  status: providerStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const serviceAreas = pgTable('service_areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 80 }).notNull(),
  polygon: jsonb('polygon'),
  centerLat: numeric('center_lat', { precision: 9, scale: 6 }),
  centerLng: numeric('center_lng', { precision: 9, scale: 6 }),
  radiusMeters: integer('radius_meters'),
  isActive: boolean('is_active').notNull().default(true),
});

export const cutoffPolicies = pgTable('cutoff_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  mealType: mealTypeEnum('meal_type'),
  cutoffOffsetHours: integer('cutoff_offset_hours'),
  cutoffTimeOfDay: time('cutoff_time_of_day'),
  timezone: varchar('timezone', { length: 40 }).notNull().default('Asia/Kathmandu'),
});

export const providerVerificationDocuments = pgTable('provider_verification_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  documentType: documentTypeEnum('document_type').notNull(),
  objectStorageKey: varchar('object_storage_key', { length: 500 }).notNull(),
  status: verificationStatusEnum('status').notNull().default('PENDING'),
  reviewedByAdminId: uuid('reviewed_by_admin_id').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

