# GharKhana — Product Requirements Document

## Document Control

| Field | Value |
|---|---|
| Status | Approved for Phase 0 planning — v1.0 |
| Owner | Product |
| Reviewers | Engineering Lead, Design Lead, Operations Lead |
| Last updated | 2026-09-19 |
| Related docs | DOMAIN_MODEL.md, UX_FLOW.md, ROADMAP.md |

## 1. Executive Summary

GharKhana is a mobile-first, recurring home-cooked meal subscription platform. Customers subscribe to a weekly or monthly meal plan and receive scheduled meals at a fixed location (typically a workplace). Home cooks, housewives, and small household kitchens register as **Providers** and fulfill these recurring schedules without operating a licensed restaurant.

The product's defining bet: **the unit of value is a managed recurring schedule, not a single transaction.** Every feature — daily customization, skip/pause, provider capacity, pricing — is designed around keeping that schedule accurate, fair, and low-friction for both sides of the marketplace.

Initial market: urban Nepal (Kathmandu Valley pilot), targeting office workers, students, and others who eat away from home on weekdays.

## 2. Problem

**For customers:** People working or studying away from home need reliable daily meals but face a repeated, low-value decision cycle — search, order, pay — every single day. Existing food delivery apps optimize for discovery and variety, not for the boring reliability that daily eating actually requires. Home-cooked "tiffin" services exist informally (WhatsApp groups, word of mouth) but have no structured way to handle payments, schedule changes, or accountability.

**For providers:** Many households can prepare additional meals with existing kitchen capacity but lack a structured way to serve recurring customers — no scheduling tool, no payment collection, no demand forecasting, and no way to be discovered beyond personal networks.

**Market gap:** No existing Nepal-market product treats "recurring meal management" as the core object. Restaurant marketplaces (e.g., Foodmandu-style apps) model everything as discrete orders, which is a poor fit for weekly/monthly tiffin-style relationships.

## 3. Vision

Make regular home-cooked meals as easy to manage as any other recurring subscription — set it up once, adjust individual days as life happens, and trust that both the meal and the payment "just work" in the background.

```text
Monday    → Dal Bhat
Tuesday   → Chicken Curry
Wednesday → Chowmein
Thursday  → Dal Bhat
Friday    → Momo
```

Customers customize individual dates without ever creating a new order. Providers see a reliable, forecastable preparation load instead of unpredictable one-off orders.

## 4. Users & Personas

### 4.1 Customer — "Reliable Ramesh"
Office worker, 24–40, works 9–6 in a fixed location, eats lunch away from home 5 days/week. Values consistency and low daily decision-making over variety. Pain: currently either eats unhealthy quick food or spends 10+ minutes every day deciding/ordering. Primary job-to-be-done: *"Make sure lunch is handled so I don't have to think about it."*

### 4.2 Customer — "Busy Student Bina"
Student or young professional sharing a room, no kitchen access or limited cooking time, price-sensitive. Wants monthly-plan affordability and flexible skip for days she's not around.

### 4.3 Provider — "Home Cook Hira"
A householder (often a woman running a home kitchen) already cooking daily for her family, with spare capacity to prepare 15–40 additional meals/day. No restaurant license, no POS system, no digital payment collection experience. Primary job-to-be-done: *"Turn my existing cooking into predictable extra income without needing to run a business."*

### 4.4 Delivery Partner — "Delivery Dipesh"
Independent or platform-affiliated rider covering a defined zone, fulfilling multiple deliveries per meal window (lunch rush, dinner rush). Needs a simple, low-friction interface — not a full logistics app.

### 4.5 Admin — Platform Operations
Internal staff responsible for provider verification, dispute resolution, refund approval, and monitoring platform health metrics.

## 5. Core Features

| Category | Features |
|---|---|
| Identity | Customer registration/auth, provider registration and verification, role-based profiles |
| Discovery | Provider discovery (location/cuisine/dietary filters), provider profile, menu browsing |
| Subscription | Weekly/monthly subscription creation, recurring schedule definition, daily meal customization, skip/pause/resume/cancel |
| Fulfillment | Delivery location management, provider preparation dashboard, delivery tracking |
| Money | Payment processing, provider earnings & payouts, refunds |
| Trust | Ratings and reviews, provider verification, disputes |
| Comms | Push + in-app notifications |
| Ops | Admin management console |

## 6. Subscription Model

A subscription is the recurring agreement between one customer and one provider. It contains:

| Field | Description |
|---|---|
| Customer | The subscribing user |
| Provider | The fulfilling household/cook |
| Delivery location | A saved `CustomerLocation` |
| Meal type | Breakfast / Lunch / Dinner / Snacks |
| Start date / End date | Billing period boundaries |
| Frequency | `WEEKLY` or `MONTHLY` recurrence unit |
| Recurring days | Subset of Mon–Sun the schedule applies to |
| Default schedule | Day-of-week → default menu item mapping |
| Daily overrides | Per-date exceptions to the default (see §7) |
| Quantity | Meals per delivery (supports household orders, default 1) |
| Price | Server-calculated total for the billing period |
| Payment status | Reflects the linked Payment record, never edited directly |

Full field types and invariants: [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) §7–8.

## 7. Daily Customization

A customer may override the default schedule for an individual date, subject to the provider's cutoff policy.

```text
Default: Dal Bhat every weekday

Monday    → Dal Bhat        (default, unmodified)
Tuesday   → Chicken Curry   (customer override, +price delta)
Wednesday → SKIP            (customer skip, refund/credit per policy)
Thursday  → Momo            (customer override)
```

**Rules:**
- Changes are permitted only before the provider's configured cutoff time for that date (see SUBSCRIPTION_ENGINE.md §9).
- The subscription's default schedule is never mutated by a one-off customization — only the specific `MealOccurrence` changes.
- Overrides that increase price require the server to recompute and, if applicable, collect the delta before confirming.

## 8. Provider Features

Providers can:

- Register as a household/home cook and submit verification documents
- Create one or more menus, each with priced menu items and dietary tags
- Define available days, service area, and daily capacity (per meal type)
- Set a modification cutoff policy (globally or per meal type)
- View a forecasted preparation quantity for any upcoming date
- Manage active subscriptions and respond to customer overrides
- View earnings, pending payouts, and payout history
- Receive real-time notifications for new subscriptions, cancellations, and customizations

## 9. Functional Requirements (MVP Scope)

Each requirement is tagged with an ID referenced from ROADMAP.md and test plans.

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Customer and provider registration/authentication (phone + OTP or email) | P0 |
| FR-2 | Customer profile management | P0 |
| FR-3 | Provider registration and document submission | P0 |
| FR-4 | Admin provider verification workflow | P0 |
| FR-5 | Provider discovery with location and meal-type filters | P0 |
| FR-6 | Menu and menu-item CRUD for providers | P0 |
| FR-7 | Weekly/monthly subscription creation with recurring schedule | P0 |
| FR-8 | Automated meal occurrence generation (rolling window) | P0 |
| FR-9 | Daily meal customization respecting cutoff | P0 |
| FR-10 | Skip / pause / resume / cancel subscription | P0 |
| FR-11 | Delivery location CRUD, serviceability check against provider service area | P0 |
| FR-12 | Payment collection via at least one Nepal payment gateway | P0 |
| FR-13 | Provider preparation dashboard (today/upcoming quantities) | P0 |
| FR-14 | Customer subscription calendar dashboard | P0 |
| FR-15 | Push notifications for key lifecycle events | P0 |
| FR-16 | Admin dashboard: verification queue, disputes, refunds | P0 |
| FR-17 | Delivery status tracking (assigned → delivered) | P1 |
| FR-18 | Ratings and reviews per subscription/provider | P1 |
| FR-19 | Provider earnings and payout history view | P1 |

## 10. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Availability | 99.5% monthly uptime for the API during MVP; target 99.9% post-Phase 4 |
| Performance | P95 API latency < 400ms for read endpoints, < 800ms for write endpoints under nominal load |
| Scalability | Backend must support horizontal scaling of stateless API instances behind a load balancer without code changes |
| Data integrity | No duplicate meal occurrences ever generated (idempotent generation is a release blocker, not a nice-to-have) |
| Localization | UI text externalized for future English/Nepali toggle even if only English ships at MVP |
| Currency | All monetary amounts in NPR at MVP; currency field on `Payment`/`Subscription` reserved for future markets |
| Accessibility | Mobile UI meets WCAG 2.1 AA color contrast and minimum touch target size (44×44dp) |
| Auditability | Every state transition on Subscription, MealOccurrence, and Payment is recorded in `audit_logs` |

## 11. MVP Scope

1. Authentication (FR-1)
2. Customer profiles (FR-2)
3. Provider registration (FR-3)
4. Provider verification (FR-4)
5. Provider discovery (FR-5)
6. Menu management (FR-6)
7. Weekly/monthly subscriptions (FR-7)
8. Recurring schedule + occurrence generation (FR-8)
9. Daily customization (FR-9)
10. Skip/pause/resume/cancel (FR-10)
11. Delivery locations (FR-11)
12. Payments — single gateway (FR-12)
13. Provider dashboard (FR-13)
14. Customer dashboard (FR-14)
15. Push notifications (FR-15)
16. Admin dashboard (FR-16)

FR-17 through FR-19 are stretch goals for the MVP release and hard requirements for the release immediately after (see ROADMAP.md Phase 5–7).

## 12. Non-Goals for MVP

Explicitly out of scope, to prevent scope creep during Phase 1–4:

- Nationwide / multi-city operations (single pilot city only)
- Advanced AI-driven meal recommendations
- Nutrition/calorie tracking
- Live GPS fleet tracking of delivery partners (status-based tracking only, see DELIVERY.md §9)
- Loyalty/rewards programs
- General restaurant marketplace expansion (single-order, non-subscription purchases)
- Corporate/enterprise bulk accounts (single-customer subscriptions only)
- In-app chat between customer and provider (notifications + admin mediation only)
- Multi-currency support

## 13. Success Metrics

| Metric | Definition | MVP Target (90 days post-launch) |
|---|---|---|
| Active subscriptions | Subscriptions in `ACTIVE` status | 250+ |
| Subscription renewal rate | % of completed subscriptions renewed within 7 days | ≥ 55% |
| Meal fulfillment rate | Delivered occurrences ÷ scheduled (non-skipped) occurrences | ≥ 97% |
| Provider retention | % of onboarded providers still active at day 60 | ≥ 70% |
| Customer retention | % of customers with ≥2 subscriptions within 90 days | ≥ 40% |
| Cancellation rate | Subscriptions cancelled before natural end date | ≤ 15% |
| Failed delivery rate | Failed ÷ total deliveries | ≤ 3% |
| Daily customization rate | % of occurrences with a customer override | Track only (no target) — informs UX priority |
| Average subscription duration | Mean days between start and end/cancellation | ≥ 21 days |

## 14. Competitive Context

| Product type | Model | Gap vs. GharKhana |
|---|---|---|
| Restaurant delivery apps (Foodmandu-style) | Per-order, restaurant-sourced | No recurring schedule concept, no home-kitchen supply |
| Informal tiffin services | Manual, WhatsApp/phone-based | No digital payments, no accountability, no discovery |
| Corporate cafeterias | Fixed on-site | Not available to most SMEs/remote workers, no customization |

## 15. Open Questions

- Which payment gateway(s) launch first — eSewa, Khalti, or Fonepay? (owner: Payments; see PAYMENTS.md §2)
- Is delivery platform-managed or provider-managed at MVP? (owner: Operations; see DELIVERY.md §2)
- What is the minimum viable provider verification bar (KYC document set) for a home-kitchen, non-licensed business? (owner: Trust & Safety, Legal)

## 16. Core Principle

A subscription is a recurring agreement. A meal occurrence is an individual scheduled meal generated from that agreement. This single sentence governs every downstream design decision in this documentation set.
