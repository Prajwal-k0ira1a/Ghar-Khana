import { z } from 'zod';

// ==========================================
// Authentication Schemas
// ==========================================

export const phoneRegex = /^\+?[0-9]{10,15}$/;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
    email: z.string().trim().email('Invalid email address').toLowerCase().optional(),
    phone: z
      .string()
      .trim()
      .regex(phoneRegex, 'Phone must be a valid E.164 phone number')
      .optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100)
      .optional(),
    role: z.enum(['CUSTOMER', 'PROVIDER']).default('CUSTOMER'),
    providerType: z
      .enum(['HOME_COOK', 'HOUSEHOLD', 'SMALL_HOME_KITCHEN'])
      .optional(),
    displayName: z.string().trim().min(2).max(120).optional(),
  })
  .refine((data) => !!data.email || !!data.phone, {
    message: 'Either email or phone is required to register',
    path: ['email'],
  })
  .refine(
    (data) => {
      if (data.role === 'PROVIDER' && !data.displayName) {
        return false;
      }
      return true;
    },
    {
      message: 'Provider display name is required for provider registration',
      path: ['displayName'],
    }
  );

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.preprocess(
  (input) => {
    if (
      input &&
      typeof input === 'object' &&
      !('login' in input) &&
      'email' in input &&
      typeof input.email === 'string'
    ) {
      return { ...input, login: input.email };
    }
    return input;
  },
  z.object({
    login: z.string().trim().min(3, 'Email or phone is required'),
    password: z.string().min(1, 'Password is required').optional(),
    isOtp: z.boolean().optional(),
  })
);

export type LoginInput = z.infer<typeof loginSchema>;

export const otpVerifySchema = z.object({
  phone: z.string().trim().regex(phoneRegex, 'Invalid phone number format'),
  code: z.string().trim().length(6, 'Verification code must be 6 digits'),
});

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(10, 'Valid refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ==========================================
// Location Schemas
// ==========================================

export const createLocationSchema = z.object({
  label: z.string().trim().min(2).max(40),
  addressLine: z.string().trim().min(5, 'Detailed address line is required'),
  landmark: z.string().trim().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  instructions: z.string().trim().max(500).optional(),
  isDefault: z.boolean().optional().default(false),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;

// ==========================================
// Subscription & Meal Schemas
// ==========================================

export const createSubscriptionSchema = z
  .object({
    providerId: z.string().uuid('Invalid provider ID'),
    locationId: z.string().uuid('Invalid location ID'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
    frequency: z.enum(['WEEKLY', 'MONTHLY']),
    mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS']),
    days: z
      .array(z.number().int().min(0).max(6))
      .min(1, 'Must select at least 1 day per week'),
    defaultMenuItemId: z.string().uuid('Invalid menu item ID'),
    quantity: z.number().int().min(1).max(50).default(1),
    promoCode: z.string().trim().max(30).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be greater than or equal to start date',
    path: ['endDate'],
  });

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const customizeMealSchema = z.object({
  menuItemId: z.string().uuid('Invalid menu item ID'),
  quantity: z.number().int().min(1).max(20).default(1),
});

export type CustomizeMealInput = z.infer<typeof customizeMealSchema>;

export const skipMealSchema = z.object({
  reason: z.string().trim().max(255).optional(),
});

export type SkipMealInput = z.infer<typeof skipMealSchema>;

// ==========================================
// Provider Operations & Admin Schemas (Phase 3)
// ==========================================

export const submitDocumentSchema = z.object({
  documentType: z.enum(['CITIZENSHIP', 'KITCHEN_PHOTO', 'FOOD_HANDLING_DECLARATION', 'OTHER']),
  objectStorageKey: z.string().trim().min(3, 'Storage key is required').max(500),
});

export type SubmitDocumentInput = z.infer<typeof submitDocumentSchema>;

export const reviewProviderSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  reason: z.string().trim().max(500).optional(),
});

export type ReviewProviderInput = z.infer<typeof reviewProviderSchema>;

export const updateProviderProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  dailyCapacity: z
    .object({
      BREAKFAST: z.number().int().min(0).max(500).optional(),
      LUNCH: z.number().int().min(0).max(500).optional(),
      DINNER: z.number().int().min(0).max(500).optional(),
      SNACKS: z.number().int().min(0).max(500).optional(),
    })
    .optional(),
});

export type UpdateProviderProfileInput = z.infer<typeof updateProviderProfileSchema>;

export const createServiceAreaSchema = z.object({
  label: z.string().trim().min(2).max(80),
  centerLat: z.number().min(-90).max(90),
  centerLng: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(100).max(50000),
  isActive: z.boolean().optional().default(true),
});

export type CreateServiceAreaInput = z.infer<typeof createServiceAreaSchema>;

export const updateServiceAreaSchema = createServiceAreaSchema.partial();

export type UpdateServiceAreaInput = z.infer<typeof updateServiceAreaSchema>;

export const updateCutoffPolicySchema = z.object({
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS']).nullable().optional(),
  cutoffOffsetHours: z.number().int().min(1).max(72).nullable().optional(),
  cutoffTimeOfDay: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM')
    .nullable()
    .optional(),
  timezone: z.string().default('Asia/Kathmandu'),
});

export type UpdateCutoffPolicyInput = z.infer<typeof updateCutoffPolicySchema>;

export const createMenuSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;

export const updateMenuSchema = createMenuSchema.partial();

export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;

export const createMenuItemSchema = z.object({
  menuId: z.string().uuid('Invalid menu ID'),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Price must be a decimal string with up to 2 decimal places'),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS']),
  availability: z.boolean().default(true),
  dietaryTags: z.array(z.string().trim()).default([]),
  imageUrl: z.string().url().max(500).optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;

export const updateMenuItemSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Price must be a decimal string with up to 2 decimal places')
    .optional(),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS']).optional(),
  availability: z.boolean().optional(),
  dietaryTags: z.array(z.string().trim()).optional(),
  imageUrl: z.string().url().max(500).optional(),
});

export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;

export const updateMealStatusSchema = z.object({
  status: z.enum(['PREPARING', 'READY', 'PICKED_UP', 'DELIVERED']),
});

export type UpdateMealStatusInput = z.infer<typeof updateMealStatusSchema>;

// ==========================================
// Payments, Refunds & Wallet Schemas (Phase 4)
// ==========================================

export const initiatePaymentSchema = z.object({
  subscriptionId: z.string().uuid('Invalid subscription ID'),
  gateway: z.enum(['ESEWA', 'KHALTI']),
  idempotencyKey: z.string().trim().min(10, 'Idempotency key must be at least 10 characters').max(255),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

export const refundPaymentSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a decimal string with up to 2 decimal places'),
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(500),
});

export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;

export const requestPayoutSchema = z
  .object({
    amount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a decimal string with up to 2 decimal places'),
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  })
  .refine((data) => data.periodEnd >= data.periodStart, {
    message: 'Period end date must be on or after period start date',
    path: ['periodEnd'],
  });

export type RequestPayoutInput = z.infer<typeof requestPayoutSchema>;

// ==========================================
// Deliveries (Phase 5 — DELIVERY.md §3, API_SPEC.md §15)
// ==========================================

export const deliveryFailureSchema = z.object({
  failureReason: z.enum([
    'CUSTOMER_UNAVAILABLE',
    'INCORRECT_ADDRESS',
    'PROVIDER_DELAY',
    'DELIVERY_ISSUE',
    'OPERATIONAL_CANCELLATION',
  ]),
  deliveryNotes: z.string().trim().max(500).optional(),
});

export type DeliveryFailureInput = z.infer<typeof deliveryFailureSchema>;

export const assignDeliverySchema = z.object({
  deliveryPartnerId: z.string().uuid('Invalid delivery partner ID').optional(),
});

export type AssignDeliveryInput = z.infer<typeof assignDeliverySchema>;

// ==========================================
// Notifications (Phase 6 — NOTIFICATIONS.md, API_SPEC.md §16)
// ==========================================

export const registerDeviceTokenSchema = z.object({
  expoPushToken: z.string().trim().min(5).max(255),
  platform: z.enum(['IOS', 'ANDROID']),
});

export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>;

// ==========================================
// Reviews & Disputes (Phase 7 — PRD FR-18, API_SPEC.md §18)
// ==========================================

export const createReviewSchema = z.object({
  subscriptionId: z.string().uuid('Invalid subscription ID'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const createDisputeSchema = z.object({
  subscriptionId: z.string().uuid('Invalid subscription ID'),
  category: z.enum(['QUALITY', 'NON_DELIVERY', 'BILLING', 'OTHER']),
});

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;

export const updateDisputeSchema = z.object({
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED']),
  resolutionNote: z.string().trim().max(1000).optional(),
});

export type UpdateDisputeInput = z.infer<typeof updateDisputeSchema>;

