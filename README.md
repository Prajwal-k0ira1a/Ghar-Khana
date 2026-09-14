# GharKhana

**Recurring home-cooked meal subscriptions for workplaces and everyday life.**

| Field | Value |
|---|---|
| Status | Phase 0–7 Complete (Backend Modules, Tests & Mobile UI Integrated) · Ready for Phase 8 Scale |
| Market | Nepal (initial), urban centers (Kathmandu Valley pilot) |
| Platform | Mobile (React Native / Expo), REST backend |
| Doc owner | Product & Engineering |
| Last updated | 2026-09-19 |

## Concept

GharKhana connects people who need regular meals with households and home cooks who can prepare them, on a recurring subscription rather than a one-off order.

```text
Monday    → Dal Bhat
Tuesday   → Chicken Curry
Wednesday → Chowmein
Thursday  → Dal Bhat
Friday    → Momo
```

The customer can customize individual days, skip meals, pause the subscription, or change the schedule according to platform and provider rules — without ever placing a new "order."

## What Makes It Different

Traditional food delivery:

```text
Customer → Individual Order → Restaurant → Delivery
```

GharKhana:

```text
Customer
   ↓
Subscription  (the recurring agreement)
   ↓
Recurring Schedule  (the weekly template)
   ↓
Daily Meal Occurrences  (the operational unit)
   ↓
Home Cook  (preparation)
   ↓
Delivery  (fulfillment)
```

The product is a **recurring meal management platform**, not another restaurant marketplace. Every architectural, data, and UX decision in this repository is anchored to that distinction — see [Core Domain Principle](#core-domain-principle) below.

## Initial Platform

**Mobile client**

- React Native + Expo (managed workflow)
- TypeScript (strict mode)
- Expo Router (file-based navigation)
- TanStack Query (server state / caching)
- Zustand (client/UI state)

**Backend**

- Node.js + Express, TypeScript
- PostgreSQL (source of truth) + Drizzle ORM
- Redis (cache, rate limiting, queues)
- BullMQ (scheduled/background jobs)
- S3-compatible object storage (documents, images)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full stack rationale and diagrams.

## Application Roles

| Role | Summary |
|---|---|
| **Customer** | Discovers providers and manages recurring meals via a subscription calendar. |
| **Provider** | A household/home cook that publishes a menu and fulfills a recurring schedule. |
| **Delivery Partner** | Fulfills meal deliveries assigned by the platform or provider. |
| **Admin** | Manages verification, disputes, payments, refunds, and platform operations. |

Full role definitions, permissions, and lifecycle states live in [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) and [SECURITY.md](./SECURITY.md).

## Repository Structure

```text
apps/
└── mobile/                # Expo application

backend/
├── src/
│   ├── modules/            # auth, users, providers, menus, subscriptions,
│   │                       # meal-occurrences, locations, payments,
│   │                       # deliveries, notifications, reviews, admin
│   ├── jobs/                # BullMQ workers
│   └── shared/               # cross-cutting concerns

packages/
├── types/                  # Shared TypeScript types (mobile + backend)
├── validation/              # Shared Zod/Yup schemas
└── config/                   # Shared lint/tsconfig/env schema

docs/
├── PRD.md                    # What we're building and why
├── DOMAIN_MODEL.md            # Entities, invariants, relationships
├── DATABASE.md                # Physical schema, indexes, migrations
├── UX_FLOW.md                  # Screen-by-screen flows, states, accessibility
├── ARCHITECTURE.md              # System design, diagrams, scaling, CI/CD
├── SUBSCRIPTION_ENGINE.md        # Core recurrence/generation algorithm
├── API_SPEC.md                    # REST contract, schemas, error catalog
├── SECURITY.md                     # AuthN/Z, data protection, threat model
├── PAYMENTS.md                      # Payment gateways, ledger, payouts
├── DELIVERY.md                       # Fulfillment, batching, SLAs
├── NOTIFICATIONS.md                   # Channels, templates, delivery rules
└── ROADMAP.md                          # Phased plan, milestones, risks
```

## Core Domain Principle

> **Subscription ≠ Meal Order**

- A **Subscription** defines the recurring agreement (who, with whom, which days, which default meals, for how long).
- A **MealOccurrence** represents one actual meal on one actual date, generated from that agreement.

This separation is what makes the following possible without special-casing:

- Daily customization and skipping
- Pausing without destroying the agreement
- Per-meal refunds and failure handling
- Independent delivery tracking per meal
- Provider preparation planning by date, not by subscription

Any design that collapses this distinction (e.g., "just store the schedule on the subscription and diff it") is considered an architectural regression. See [SUBSCRIPTION_ENGINE.md](./SUBSCRIPTION_ENGINE.md) §4–6.

## Documentation Reading Order

New engineers, designers, or reviewers should read in this order:

1. [PRD.md](./PRD.md) — product context, personas, scope
2. [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) — the vocabulary everything else uses
3. [DATABASE.md](./DATABASE.md) — how the domain model is persisted
4. [UX_FLOW.md](./UX_FLOW.md) — how users experience the domain model
5. [ARCHITECTURE.md](./ARCHITECTURE.md) — how the system is built and deployed
6. [SUBSCRIPTION_ENGINE.md](./SUBSCRIPTION_ENGINE.md) — the core business engine
7. [API_SPEC.md](./API_SPEC.md) — the contract between mobile and backend
8. [SECURITY.md](./SECURITY.md) — how trust boundaries are enforced
9. [PAYMENTS.md](./PAYMENTS.md) — money movement and reconciliation
10. [DELIVERY.md](./DELIVERY.md) — fulfillment operations
11. [NOTIFICATIONS.md](./NOTIFICATIONS.md) — communication rules
12. [ROADMAP.md](./ROADMAP.md) — sequencing and milestones

## Conventions Used Across These Docs

- **MUST / MUST NOT / SHOULD** follow RFC 2119 meaning: MUST is a hard requirement, SHOULD is a strong default that needs a written justification to violate.
- All money values are **decimal**, stored in the smallest currency subunit is *not* used here — NPR has paisa but the platform stores 2-decimal `numeric(10,2)` amounts; see [DATABASE.md](./DATABASE.md) §12.
- All timestamps are UTC in storage and transit; display conversion to `Asia/Kathmandu` happens client-side. See [SUBSCRIPTION_ENGINE.md](./SUBSCRIPTION_ENGINE.md) §4.
- Every backend-enforced rule referenced here (price, capacity, cutoff, status) is non-negotiable client-side — the mobile app is a rendering layer, not a source of truth.

## Status & Next Steps

This documentation set is functionally complete for an MVP build. Open items are tracked as `TBD` inline and summarized in [ROADMAP.md](./ROADMAP.md) §Risks & Open Questions. Before Phase 1 engineering kicks off, the following should be ratified by product + engineering leads:

- [x] Final choice of payment gateway(s) for launch city: **eSewa** via adapter pattern (PAYMENTS.md §2, §8)
- [x] Final delivery model for MVP: **Provider-managed delivery** / direct fulfillment with platform status tracking (DELIVERY.md §2)
- [x] Data residency / hosting region decision: Containerized Node.js + PostgreSQL 15+ with Drizzle ORM + Redis (ARCHITECTURE.md §12)

## License & Contact

Internal product documentation. Not yet licensed for external distribution. Direct questions to the product/engineering leads listed in each document's Document Control block.
