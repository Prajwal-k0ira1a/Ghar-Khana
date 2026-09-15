// ==========================================
// GharKhana Domain Enums
// ==========================================

export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'DELIVERY_PARTNER' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export type ProviderType = 'HOME_COOK' | 'HOUSEHOLD' | 'SMALL_HOME_KITCHEN';
export type VerificationStatus = 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
export type ProviderStatus = 'ACTIVE' | 'PAUSED_BY_PROVIDER' | 'SUSPENDED_BY_ADMIN';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS';
export type SubscriptionFrequency = 'WEEKLY' | 'MONTHLY';
export type SubscriptionStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type OccurrenceStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'SKIPPED'
  | 'CANCELLED'
  | 'FAILED';

export type CustomizationSource =
  | 'DEFAULT'
  | 'CUSTOMER_OVERRIDE'
  | 'PROVIDER_ADJUSTED'
  | 'ADMIN_ADJUSTED';

export type DeliveryStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type DeliveryFailureReason =
  | 'CUSTOMER_UNAVAILABLE'
  | 'INCORRECT_ADDRESS'
  | 'PROVIDER_DELAY'
  | 'DELIVERY_ISSUE'
  | 'OPERATIONAL_CANCELLATION';

export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentGateway = 'ESEWA' | 'KHALTI' | 'FONEPAY';

export type LedgerEntryType =
  | 'MEAL_EARNING'
  | 'PLATFORM_FEE'
  | 'PAYOUT'
  | 'ADJUSTMENT'
  | 'REFUND_DEDUCTION';

export type PayoutStatus = 'SCHEDULED' | 'PROCESSING' | 'PAID' | 'FAILED';
export type NotificationPriority = 'HIGH' | 'NORMAL' | 'LOW';
export type MenuStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// ==========================================
// Domain Entities
// ==========================================

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  phoneVerifiedAt: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Provider {
  id: string;
  userId: string;
  providerType: ProviderType;
  displayName: string;
  description: string | null;
  verificationStatus: VerificationStatus;
  dailyCapacity: Record<MealType, number>;
  rating: number | null;
  ratingCount: number;
  status: ProviderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceArea {
  id: string;
  providerId: string;
  label: string;
  polygon: unknown | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusMeters: number | null;
  isActive: boolean;
}

export interface CutoffPolicy {
  id: string;
  providerId: string;
  mealType: MealType | null;
  cutoffOffsetHours: number | null;
  cutoffTimeOfDay: string | null;
  timezone: string;
}

export interface CustomerLocation {
  id: string;
  customerId: string;
  label: string;
  addressLine: string;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  instructions: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Menu {
  id: string;
  providerId: string;
  name: string;
  description: string | null;
  status: MenuStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  menuId: string;
  name: string;
  description: string | null;
  price: string;
  mealType: MealType;
  availability: boolean;
  dietaryTags: string[];
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionSchedule {
  id: string;
  subscriptionId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  defaultMenuItemId: string;
  quantity: number;
}

export interface Subscription {
  id: string;
  customerId: string;
  providerId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  frequency: SubscriptionFrequency;
  mealType: MealType;
  status: SubscriptionStatus;
  quantity: number;
  totalPrice: string;
  cutoffPolicyId: string | null;
  promoRedemptionId: string | null;
  createdAt: string;
  updatedAt: string;
  schedule?: SubscriptionSchedule[];
}

export interface MealOccurrence {
  id: string;
  subscriptionId: string;
  providerId: string;
  scheduledDate: string;
  menuItemId: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  status: OccurrenceStatus;
  customizationSource: CustomizationSource;
  cutoffAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Delivery {
  id: string;
  mealOccurrenceId: string;
  deliveryPartnerId: string | null;
  status: DeliveryStatus;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  failureReason: DeliveryFailureReason | null;
  deliveryNotes: string | null;
  proofType: string | null;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  customerId: string;
  amount: string;
  currency: string;
  gateway: PaymentGateway;
  providerReference: string | null;
  status: PaymentStatus;
  idempotencyKey: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  providerId: string;
  balance: string;
  currency: string;
}

export interface LedgerEntry {
  id: string;
  walletId: string;
  type: LedgerEntryType;
  amount: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
}

// ==========================================
// API Envelopes & Responses
// ==========================================

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

// ==========================================
// Auth Request & Response Payloads
// ==========================================

export interface RegisterRequest {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: 'CUSTOMER' | 'PROVIDER';
  providerType?: ProviderType;
  displayName?: string;
}

export interface LoginRequest {
  login: string; // email or phone
  password?: string;
  isOtp?: boolean;
}

export interface OtpVerifyRequest {
  phone: string;
  code: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  provider?: Provider | null;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
