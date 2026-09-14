# GharKhana — API Specification

## Document Control

| Field | Value |
|---|---|
| Status | v1.0 — REST contract between mobile client and backend |
| Base URL | `https://api.gharkhana.app/api/v1` (production, illustrative) |

## 1. Conventions

- All requests and responses are `application/json`, UTF-8.
- All authenticated requests carry `Authorization: Bearer <accessToken>`.
- All non-idempotent mutating requests (`POST`) that create a financial or irreversible side effect (subscription creation, payment initiation) **must** include an `Idempotency-Key` header (client-generated UUID). Replaying the same key returns the original result rather than creating a duplicate.
- All list endpoints are paginated with `?page=1&pageSize=20` (default `pageSize=20`, max `100`) and return the envelope shown in §3.
- All timestamps in payloads are ISO-8601 UTC (`2026-10-01T00:00:00Z`); the client converts to `Asia/Kathmandu` for display.
- All monetary amounts are strings representing decimal values (e.g., `"350.00"`), never floating-point JSON numbers, to avoid precision loss.

## 2. Versioning

- Breaking changes (removed fields, changed field types/semantics, removed endpoints) require a new base path version (`/api/v2`), with the previous version supported for a documented deprecation window (minimum 90 days post-MVP).
- Additive changes (new optional fields, new endpoints, new enum values that clients must already handle gracefully) do not require a version bump. Clients **must** ignore unknown fields and unknown enum values rather than failing hard.

## 3. Response Envelope

**Success (single resource):**
```json
{ "data": { "...": "..." } }
```

**Success (list):**
```json
{
  "data": [ { "...": "..." } ],
  "pagination": { "page": 1, "pageSize": 20, "totalItems": 143, "totalPages": 8 }
}
```

**Error:**
```json
{
  "error": {
    "code": "MODIFICATION_CUTOFF_PASSED",
    "message": "This meal can no longer be modified.",
    "details": { "cutoffAt": "2026-10-05T14:15:00Z" }
  }
}
```

## 4. HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Resource created |
| 204 | Success, no content (e.g., DELETE) |
| 400 | Validation error (malformed request) |
| 401 | Unauthenticated (missing/expired token) |
| 403 | Unauthorized (authenticated but not permitted) |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate idempotency key with different payload) |
| 422 | Business rule violation (e.g., cutoff passed, capacity full) |
| 429 | Rate limited — includes `Retry-After` header |
| 500 | Internal error |

## 5. Error Code Catalog (selected)

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body failed schema validation |
| `INVALID_CREDENTIALS` | 401 | Login failed |
| `TOKEN_EXPIRED` | 401 | Access token expired, client should refresh |
| `FORBIDDEN_ROLE` | 403 | Authenticated user's role cannot perform this action |
| `NOT_OWNER` | 403 | Resource exists but does not belong to the requester |
| `SUBSCRIPTION_NOT_FOUND` | 404 | |
| `LOCATION_NOT_SERVICEABLE` | 422 | Customer location outside provider's active service area |
| `PROVIDER_NOT_VERIFIED` | 422 | Cannot subscribe to an unverified/inactive provider |
| `MODIFICATION_CUTOFF_PASSED` | 422 | Meal can no longer be changed or skipped |
| `PROVIDER_CAPACITY_EXCEEDED` | 422 | Requested quantity exceeds remaining daily capacity |
| `MENU_ITEM_UNAVAILABLE` | 422 | Selected menu item is currently marked unavailable |
| `PAYMENT_ALREADY_PROCESSED` | 409 | Idempotency key reused after success |
| `RATE_LIMITED` | 429 | Too many requests |

## 6. Authentication

```text
POST /auth/register        Create account (customer or provider-track)
POST /auth/login            Email/phone + password, or initiate OTP
POST /auth/otp/verify        Verify OTP code
POST /auth/refresh            Exchange refresh token for new access token
POST /auth/logout              Revoke refresh token
```

**POST /auth/register** — request:
```json
{
  "name": "Ramesh Shrestha",
  "phone": "+9779800000000",
  "role": "CUSTOMER"
}
```

**POST /auth/refresh** — response:
```json
{ "data": { "accessToken": "...", "expiresIn": 900 } }
```

Access tokens expire in 15 minutes; refresh tokens rotate on every use (SECURITY.md §1).

## 7. Current User

```text
GET   /users/me
PATCH /users/me
```

## 8. Locations

```text
GET    /users/me/locations
POST   /users/me/locations
PATCH  /locations/:id
DELETE /locations/:id
```

## 9. Providers

```text
GET  /providers                    ?lat=&lng=&mealType=&dietaryTag=&page=
GET  /providers/:id
POST /providers                    (provider onboarding — creates in PENDING state)
PATCH /providers/:id
POST /providers/:id/verification   (submit verification documents)
```

**GET /providers** — response item:
```json
{
  "id": "prov_123",
  "displayName": "Hira's Kitchen",
  "providerType": "HOME_COOK",
  "rating": 4.6,
  "ratingCount": 38,
  "verificationStatus": "VERIFIED",
  "servesMealTypes": ["LUNCH", "DINNER"],
  "isServiceable": true
}
```

## 10. Menus

```text
GET    /providers/:providerId/menus
POST   /providers/:providerId/menus
PATCH  /menus/:id
DELETE /menus/:id

GET    /menus/:menuId/items
POST   /menus/:menuId/items
PATCH  /menu-items/:id
DELETE /menu-items/:id
```

## 11. Subscriptions

```text
GET    /subscriptions                ?status=&page=
POST   /subscriptions
GET    /subscriptions/:id
PATCH  /subscriptions/:id

POST   /subscriptions/:id/pause
POST   /subscriptions/:id/resume
POST   /subscriptions/:id/cancel
```

**POST /subscriptions** — request:
```json
{
  "providerId": "prov_123",
  "locationId": "loc_123",
  "startDate": "2026-10-01",
  "endDate": "2026-10-31",
  "mealType": "LUNCH",
  "frequency": "WEEKLY",
  "days": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
  "defaultMenuItemId": "item_123",
  "quantity": 1,
  "promoCode": "GHAR100"
}
```

**201 response:**
```json
{
  "data": {
    "id": "sub_123",
    "status": "DRAFT",
    "totalPrice": "6600.00",
    "currency": "NPR"
  }
}
```

Server validates, in order: provider verification status, service-area match for `locationId`, menu item availability and `mealType` match, provider daily capacity for each generated date, and computes `totalPrice` from authoritative `MenuItem.price` — the client-submitted price, if any, is ignored.

## 12. Schedule

```text
GET /subscriptions/:id/schedule
PUT /subscriptions/:id/schedule
```

`PUT` replaces the full day-of-week → default-menu-item mapping; it does **not** touch already-generated `MealOccurrence` rows for dates before the change takes effect (see SUBSCRIPTION_ENGINE.md §5 for the cutover rule).

## 13. Meals (Occurrences)

```text
GET   /subscriptions/:id/meals       ?from=&to=
GET   /meals/:id
PATCH /meals/:id

POST  /meals/:id/skip
POST  /meals/:id/restore
```

**PATCH /meals/:id** — request:
```json
{ "menuItemId": "item_456", "quantity": 1 }
```

Server validates, in order:
1. Requester owns the parent subscription
2. Subscription status is `ACTIVE`
3. `now() < meal.cutoffAt`
4. New `menuItemId` belongs to the same provider and is `available`
5. Provider has remaining capacity for the target date/meal type
6. Recomputes `unitPrice`/`totalPrice` from current `MenuItem.price`

Failure at any step returns `422` with the corresponding error code from §5.

## 14. Payments

```text
POST /payments                       {subscriptionId, gateway}
GET  /payments/:id
GET  /subscriptions/:id/payments
POST /payments/webhook               (gateway → backend, signature-verified)
```

**POST /payments** — response includes a gateway-specific redirect/session payload (PAYMENTS.md §3).

## 15. Delivery

```text
GET  /deliveries                     ?status=&date=
GET  /deliveries/:id
POST /deliveries/:id/accept
POST /deliveries/:id/picked-up
POST /deliveries/:id/delivered
```

## 16. Notifications

```text
GET   /notifications                 ?unreadOnly=
PATCH /notifications/:id/read
POST  /notifications/read-all
```

## 17. Provider Operations

```text
GET   /provider/subscriptions
GET   /provider/meals/today
GET   /provider/meals/upcoming        ?days=7
PATCH /provider/meals/:id/status
GET   /provider/earnings              ?from=&to=
GET   /provider/payouts
```

## 18. Admin

```text
GET   /admin/providers/pending
POST  /admin/providers/:id/verify
POST  /admin/providers/:id/reject
GET   /admin/disputes
PATCH /admin/disputes/:id
POST  /admin/subscriptions/:id/refund
```

Admin endpoints require `role IN (ADMIN, SUPER_ADMIN)` and are additionally audit-logged on every write.

## 19. Rate Limiting

| Endpoint group | Limit |
|---|---|
| `/auth/*` | 10 requests / 15 min / IP |
| `/auth/otp/verify` | 5 attempts / 15 min / phone number |
| `POST /subscriptions`, `POST /payments` | 20 requests / hour / user |
| All other authenticated endpoints | 300 requests / 15 min / user |

Rate-limited responses return `429` with a `Retry-After` header and `RATE_LIMITED` error code.

## 20. Example: Full Error Response

```json
{
  "error": {
    "code": "PROVIDER_CAPACITY_EXCEEDED",
    "message": "This provider has no remaining capacity for LUNCH on 2026-10-06.",
    "details": { "date": "2026-10-06", "mealType": "LUNCH", "remainingCapacity": 0 }
  }
}
```

## 21. Webhook Payload Example (Payment Gateway → Backend)

```json
{
  "event": "payment.completed",
  "gatewayTransactionId": "esewa_txn_9f31...",
  "referenceId": "pay_123",
  "amount": "6600.00",
  "status": "SUCCESS",
  "signature": "..."
}
```

The backend verifies `signature` against the gateway's shared secret before trusting any field in this payload (SECURITY.md §6, PAYMENTS.md §7). Webhook processing is idempotent on `gatewayTransactionId`.
