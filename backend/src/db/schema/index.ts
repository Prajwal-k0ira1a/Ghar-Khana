import { relations } from 'drizzle-orm';
import { users, refreshTokens, deviceTokens } from './users';
import { providers, serviceAreas, cutoffPolicies, providerVerificationDocuments } from './providers';
import { customerLocations } from './locations';
import { menus, menuItems } from './menus';
import { subscriptions, subscriptionSchedules } from './subscriptions';
import { mealOccurrences } from './mealOccurrences';
import { deliveries } from './deliveries';
import { payments } from './payments';
import { wallets, ledgerEntries } from './wallets';
import { providerPayouts } from './payouts';
import { promoCodes, promoRedemptions } from './promos';
import { notifications } from './notifications';
import { reviews } from './reviews';
import { disputes } from './disputes';

export * from './enums';
export * from './users';
export * from './providers';
export * from './locations';
export * from './menus';
export * from './subscriptions';
export * from './mealOccurrences';
export * from './deliveries';
export * from './payments';
export * from './wallets';
export * from './payouts';
export * from './promos';
export * from './notifications';
export * from './reviews';
export * from './disputes';
export * from './auditLogs';

// ==========================================
// Drizzle Relations
// ==========================================

export const usersRelations = relations(users, ({ one, many }) => ({
  provider: one(providers, {
    fields: [users.id],
    references: [providers.userId],
  }),
  refreshTokens: many(refreshTokens),
  deviceTokens: many(deviceTokens),
  customerLocations: many(customerLocations),
  subscriptions: many(subscriptions),
  notifications: many(notifications),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, {
    fields: [providers.userId],
    references: [users.id],
  }),
  menus: many(menus),
  serviceAreas: many(serviceAreas),
  cutoffPolicies: many(cutoffPolicies),
  verificationDocuments: many(providerVerificationDocuments),
  subscriptions: many(subscriptions),
  mealOccurrences: many(mealOccurrences),
  wallet: one(wallets, {
    fields: [providers.id],
    references: [wallets.providerId],
  }),
  payouts: many(providerPayouts),
}));

export const menusRelations = relations(menus, ({ one, many }) => ({
  provider: one(providers, {
    fields: [menus.providerId],
    references: [providers.id],
  }),
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  menu: one(menus, {
    fields: [menuItems.menuId],
    references: [menus.id],
  }),
  mealOccurrences: many(mealOccurrences),
}));

export const customerLocationsRelations = relations(customerLocations, ({ one }) => ({
  customer: one(users, {
    fields: [customerLocations.customerId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  customer: one(users, {
    fields: [subscriptions.customerId],
    references: [users.id],
  }),
  provider: one(providers, {
    fields: [subscriptions.providerId],
    references: [providers.id],
  }),
  location: one(customerLocations, {
    fields: [subscriptions.locationId],
    references: [customerLocations.id],
  }),
  schedule: many(subscriptionSchedules),
  occurrences: many(mealOccurrences),
  payments: many(payments),
  review: one(reviews, {
    fields: [subscriptions.id],
    references: [reviews.subscriptionId],
  }),
}));

export const subscriptionSchedulesRelations = relations(subscriptionSchedules, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionSchedules.subscriptionId],
    references: [subscriptions.id],
  }),
  defaultMenuItem: one(menuItems, {
    fields: [subscriptionSchedules.defaultMenuItemId],
    references: [menuItems.id],
  }),
}));

export const mealOccurrencesRelations = relations(mealOccurrences, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [mealOccurrences.subscriptionId],
    references: [subscriptions.id],
  }),
  provider: one(providers, {
    fields: [mealOccurrences.providerId],
    references: [providers.id],
  }),
  menuItem: one(menuItems, {
    fields: [mealOccurrences.menuItemId],
    references: [menuItems.id],
  }),
  delivery: one(deliveries, {
    fields: [mealOccurrences.id],
    references: [deliveries.mealOccurrenceId],
  }),
}));

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  mealOccurrence: one(mealOccurrences, {
    fields: [deliveries.mealOccurrenceId],
    references: [mealOccurrences.id],
  }),
  deliveryPartner: one(users, {
    fields: [deliveries.deliveryPartnerId],
    references: [users.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  provider: one(providers, {
    fields: [wallets.providerId],
    references: [providers.id],
  }),
  ledgerEntries: many(ledgerEntries),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  wallet: one(wallets, {
    fields: [ledgerEntries.walletId],
    references: [wallets.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  customer: one(users, {
    fields: [payments.customerId],
    references: [users.id],
  }),
}));

export const serviceAreasRelations = relations(serviceAreas, ({ one }) => ({
  provider: one(providers, {
    fields: [serviceAreas.providerId],
    references: [providers.id],
  }),
}));

export const cutoffPoliciesRelations = relations(cutoffPolicies, ({ one }) => ({
  provider: one(providers, {
    fields: [cutoffPolicies.providerId],
    references: [providers.id],
  }),
}));

export const providerVerificationDocumentsRelations = relations(
  providerVerificationDocuments,
  ({ one }) => ({
    provider: one(providers, {
      fields: [providerVerificationDocuments.providerId],
      references: [providers.id],
    }),
  })
);

export const deviceTokensRelations = relations(deviceTokens, ({ one }) => ({
  user: one(users, {
    fields: [deviceTokens.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  customer: one(users, {
    fields: [reviews.customerId],
    references: [users.id],
  }),
  provider: one(providers, {
    fields: [reviews.providerId],
    references: [providers.id],
  }),
  subscription: one(subscriptions, {
    fields: [reviews.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [disputes.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const providerPayoutsRelations = relations(providerPayouts, ({ one }) => ({
  provider: one(providers, {
    fields: [providerPayouts.providerId],
    references: [providers.id],
  }),
}));

export const promoRedemptionsRelations = relations(promoRedemptions, ({ one }) => ({
  promoCode: one(promoCodes, {
    fields: [promoRedemptions.promoCodeId],
    references: [promoCodes.id],
  }),
  subscription: one(subscriptions, {
    fields: [promoRedemptions.subscriptionId],
    references: [subscriptions.id],
  }),
}));


