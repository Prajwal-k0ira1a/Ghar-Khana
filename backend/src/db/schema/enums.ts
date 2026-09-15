import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'CUSTOMER',
  'PROVIDER',
  'DELIVERY_PARTNER',
  'ADMIN',
  'SUPER_ADMIN',
]);

export const userStatusEnum = pgEnum('user_status', [
  'ACTIVE',
  'SUSPENDED',
  'DEACTIVATED',
]);

export const devicePlatformEnum = pgEnum('device_platform', ['IOS', 'ANDROID']);

export const providerTypeEnum = pgEnum('provider_type', [
  'HOME_COOK',
  'HOUSEHOLD',
  'SMALL_HOME_KITCHEN',
]);

export const verificationStatusEnum = pgEnum('verification_status', [
  'PENDING',
  'IN_REVIEW',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
]);

export const providerStatusEnum = pgEnum('provider_status', [
  'ACTIVE',
  'PAUSED_BY_PROVIDER',
  'SUSPENDED_BY_ADMIN',
]);

export const documentTypeEnum = pgEnum('document_type', [
  'CITIZENSHIP',
  'KITCHEN_PHOTO',
  'FOOD_HANDLING_DECLARATION',
  'OTHER',
]);

export const menuStatusEnum = pgEnum('menu_status', [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
]);

export const mealTypeEnum = pgEnum('meal_type', [
  'BREAKFAST',
  'LUNCH',
  'DINNER',
  'SNACKS',
]);

export const frequencyEnum = pgEnum('subscription_frequency', [
  'WEEKLY',
  'MONTHLY',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'DRAFT',
  'PENDING_PAYMENT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
]);

export const occurrenceStatusEnum = pgEnum('occurrence_status', [
  'SCHEDULED',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'DELIVERED',
  'SKIPPED',
  'CANCELLED',
  'FAILED',
]);

export const customizationSourceEnum = pgEnum('customization_source', [
  'DEFAULT',
  'CUSTOMER_OVERRIDE',
  'PROVIDER_ADJUSTED',
  'ADMIN_ADJUSTED',
]);

export const deliveryStatusEnum = pgEnum('delivery_status', [
  'PENDING',
  'ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
]);

export const deliveryFailureReasonEnum = pgEnum('delivery_failure_reason', [
  'CUSTOMER_UNAVAILABLE',
  'INCORRECT_ADDRESS',
  'PROVIDER_DELAY',
  'DELIVERY_ISSUE',
  'OPERATIONAL_CANCELLATION',
]);

export const proofTypeEnum = pgEnum('proof_type', [
  'OTP',
  'PHOTO',
  'CUSTOMER_CONFIRMATION',
]);

export const paymentGatewayEnum = pgEnum('payment_gateway', [
  'ESEWA',
  'KHALTI',
  'FONEPAY',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
]);

export const ledgerEntryTypeEnum = pgEnum('ledger_entry_type', [
  'MEAL_EARNING',
  'PLATFORM_FEE',
  'PAYOUT',
  'ADJUSTMENT',
  'REFUND_DEDUCTION',
]);

export const ledgerReferenceTypeEnum = pgEnum('ledger_reference_type', [
  'MEAL_OCCURRENCE',
  'PROVIDER_PAYOUT',
  'DISPUTE',
]);

export const payoutStatusEnum = pgEnum('payout_status', [
  'SCHEDULED',
  'PROCESSING',
  'PAID',
  'FAILED',
]);

export const discountTypeEnum = pgEnum('discount_type', ['PERCENT', 'FIXED']);

export const notificationPriorityEnum = pgEnum('notification_priority', [
  'HIGH',
  'NORMAL',
  'LOW',
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'PUBLISHED',
  'FLAGGED',
  'REMOVED',
]);

export const disputeCategoryEnum = pgEnum('dispute_category', [
  'QUALITY',
  'NON_DELIVERY',
  'BILLING',
  'OTHER',
]);

export const disputeStatusEnum = pgEnum('dispute_status', [
  'OPEN',
  'IN_REVIEW',
  'RESOLVED',
  'REJECTED',
]);

