# GharKhana (घरखाना)

**Recurring home-cooked meal subscriptions for workplaces and everyday life.**

GharKhana connects people who need regular, healthy meals with verified neighborhood home cooks and kitchens on a recurring subscription basis rather than impulse one-off ordering.

---

## 1. Core Domain Philosophy

### The Fundamental Axiom: `Subscription ≠ Meal Order`

Traditional food delivery applications treat every transaction as an isolated restaurant order:
```text
Customer → Individual Order → Restaurant Marketplace → Delivery Driver
```

GharKhana is designed as a **recurring meal management platform**:
```text
Customer
   │
   ▼
Subscription (The recurring agreement: days, slot, kitchen, billing cycle)
   │
   ▼
Recurring Schedule (Weekly template: Mon–Fri default dishes)
   │
   ▼
Daily Meal Occurrences (Operational units: generated 14 days rolling)
   │
   ├─► Home Kitchen (Batch preparation by dish count)
   └─► Delivery Partner (Scheduled neighborhood fulfillment)
```

This clear architectural separation enables:
- **10:30 AM Cutoff Guarantee**: Free meal swaps or zero-penalty skips before 10:30 AM without altering the underlying weekly subscription.
- **Batch Cooking Operations**: Kitchens prepare 30–50 portions of 2–3 dishes instead of 50 custom one-off orders.
- **Predictable Local Delivery**: Clustered neighborhood drops rather than chaotic point-to-point courier routing.
- **Fair Economics**: Sustainable income for home cooks with 10% platform commission compared to 25–35% on traditional aggregators.

---

## 2. Information Density & Calm UI Design

The entire mobile application is built strictly following the **Information Density — Critical Design Rule**:
> **"Show what matters now. Hide what can wait."**

- **Light, Editorial Aesthetic**: Restrained light palette (`#F8FAFC` background, `#FFFFFF` surfaces, hairline 1px `#E2E8F0` dividers, warm saffron `#F97316` brand accents, and cardamom green `#10B981` status tags).
- **Zero Emojis**: Automated zero-emoji enforcement across code and copy in favor of clean typographic hierarchy.
- **Anti-Card Stacking**: Content is grouped using whitespace and dividers rather than floating nested card stacks.
- **3-Level Progressive Disclosure**:
  - **Level 1 (NOW)**: Today's meal slot, dish title, delivery window, and current cutoff countdown. Visible instantly.
  - **Level 2 (SOON)**: Minimal upcoming 3-day schedule preview, kitchen distance, and plan summary.
  - **Level 3 (DETAILS)**: Detailed ingredients, operational rules, receipts, and full reviews shown only on request.

---

## 3. Key Features by Role

### Customer (Consumer)
- **Daily Planner (Home)**: Answers *"What am I eating today?"* with a single primary action: `[Change meal]`.
- **Neighborhood Discovery**: Discover verified home kitchens within 5 km, sorted by distance, starting price in NPR, and dietary specialty.
- **14-Day Rolling Calendar**: View upcoming meal schedule, swap dishes before 10:30 AM, or pause days without subscription penalty.
- **3-Step Subscription Checkout**: Select weekly/monthly duration, toggle delivery days (e.g. Sun–Fri), verify address instructions, and checkout via eSewa.
- **Live Delivery Tracking**: Real-time state tracker (`SCHEDULED` ➔ `PREPARING` ➔ `PICKED_UP` ➔ `DELIVERED`).

### Kitchen Provider (Home Cook)
- **Preparation Dashboard (Rule 18)**: Concise batch view showing total portions and dish aggregation breakdown (e.g. `Dal Bhat: 24`, `Chicken Thali: 12`) with a single primary CTA `[Start preparing]`.
- **Dynamic Capacity Management**: Cap daily preparation quotas (Lunch, Dinner, Snacks) to prevent kitchen overload.
- **Menu Catalog**: Instant stock toggles, dish creation with dietary classifications, and portion pricing in NPR.
- **Subscribers Roster**: Structured customer directory with delivery addresses, portion counts, and payment verification.

### Operations & Delivery Partner
- **State Machine Transitions**: Handover verification, pickup dispatch, and photo/OTP delivery confirmation.
- **Financial Ledger**: Double-entry bookkeeping for advance subscriptions, kitchen payout balances, and eSewa payment reconciliation.

---

## 4. Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile App** | React Native, Expo SDK 52, Expo Router v3 (file-based routing), TypeScript (strict mode), TanStack Query, Zustand, Lucide Icons |
| **Backend API** | Node.js, Fastify / Express, TypeScript, Zod validation |
| **Database & Cache** | PostgreSQL 15+ (source of truth), Drizzle ORM, Redis (rate limiting & session caching) |
| **Job Queue** | BullMQ (14-day rolling occurrence generation, cutoff enforcement, quiet-hour notifications) |
| **Payments** | eSewa Payment Gateway (Nepal), idempotency ledger, webhook signature verification |
| **Design System** | Restrained Light Palette tokens (`tokens.ts`), Information Density guidelines (`.agents/skills/information-density/`) |

---

## 5. Repository Structure

```text
GharKhana/
├── apps/
│   └── mobile/                       # React Native / Expo Router mobile application
│       ├── app/
│       │   ├── (auth)/               # Sign In, Sign Up, role switching
│       │   ├── (customer)/           # Home, Discover, Calendar, Notifications, Profile
│       │   ├── (provider)/           # Batch Dashboard, Menu, Subscriptions, Kitchen Profile
│       │   ├── provider-detail.tsx   # Kitchen menu profile & dish view
│       │   └── subscribe.tsx         # 3-step subscription checkout wizard
│       └── src/
│           ├── components/           # UI components (Button, Input, Badge, Header, DeliveryCard)
│           ├── stores/               # Zustand state stores (auth, cart, notifications)
│           └── theme/tokens.ts       # Design tokens (colors, typography, spacing, radii)
│
├── backend/
│   ├── src/
│   │   ├── db/                       # Drizzle schema, migrations, connection pool, seeders
│   │   ├── modules/                  # auth, subscriptions, providers, menus, payments, delivery
│   │   ├── shared/                   # logger (Pino), JWT auth guards, middleware
│   │   └── test/                     # Phase 1–7 automated integration test suites
│   └── package.json
│
├── packages/
│   ├── types/                        # Shared TypeScript interfaces (MealOccurrence, User, Subscription)
│   ├── validation/                   # Shared Zod schemas (auth, subscription, menu validations)
│   └── config/                       # Shared tsconfig and ESLint configurations
│
├── docs/                             # Complete Phase 0 architectural & product specifications
│   ├── ARCHITECTURE.md               # System design, data flow, scaling
│   ├── DOMAIN_MODEL.md               # Entities, state machines, invariants
│   ├── SUBSCRIPTION_ENGINE.md        # 14-day rolling schedule generation algorithm
│   └── PAYMENTS.md                   # eSewa integration & ledger schema
│
├── .agents/skills/
│   └── information-density/SKILL.md  # Information Density design rule & UI audit skill
│
├── UI_DOCUMENTATION.md               # Screen-by-screen UI guide and design system rules
└── package.json                      # Monorepo root scripts & pnpm workspace config
```

---

## 6. Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **pnpm**: `v9.0.0` or higher (`npm install -g pnpm`)
- **PostgreSQL**: `v15+` (local or hosted via Docker / Supabase / Neon)
- **Redis**: `v6+` (for BullMQ queues and session caching)

---

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/Prajwal-k0ira1a/Ghar-Khana.git
cd GharKhana
pnpm install
```

---

### Step 2: Configure Environment Variables

Create `.env` inside `backend/`:

```env
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/gharkhana

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_SECRET=super-secret-development-jwt-key-replace-in-production
JWT_EXPIRES_IN=7d

# eSewa Payment Integration
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_API_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
```

---

### Step 3: Run Database Migrations & Seed Data

```bash
# Push schema and seed initial demo accounts
pnpm db:push
pnpm db:seed
```

---

### Step 4: Run the Development Servers

You can run both servers concurrently or in separate terminals:

#### Run Backend Server:
```bash
pnpm dev:backend
# API running at http://localhost:3000
```

#### Run Mobile Application:
```bash
pnpm dev:mobile
# Expo running on port 8082
# Press 'w' to launch in Web browser, 'a' for Android, or 'i' for iOS Simulator
```

---

## 7. Demo Accounts & Seed Credentials

The database seeder pre-populates realistic accounts for immediate testing:

| Role | Email | Phone Number | Password | Default Landing |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | `customer@gharkhana.app` | `+9779800000001` | `Password123!` | `/(customer)/home` |
| **Kitchen Provider** | `provider@gharkhana.app` | `+9779800000002` | `Password123!` | `/(provider)/dashboard` |
| **Platform Admin** | `admin@gharkhana.app` | `+9779800000003` | `AdminPassword123!` | `/admin` |

*(Note: The mobile login screen features one-tap demo fill buttons to test both roles effortlessly.)*

---

## 8. Verification & Test Suite

The repository contains end-to-end integration test suites validating all 7 development phases:

```bash
# Run all automated tests across Phase 1–7
pnpm test

# Run strict TypeScript check across all 5 workspace projects
pnpm typecheck
```

### Verified Test Matrix:
- **Phase 1**: Authentication, password hashing, JWT guards, role permissions.
- **Phase 2**: 14-day rolling subscription engine, recurrence schedule expansion, daily cutoff enforcement.
- **Phase 3**: Provider kitchen onboarding, service area radius validation, daily prep aggregation.
- **Phase 4**: eSewa payment gateway adapter, webhook idempotency, double-entry ledger.
- **Phase 5**: Delivery state machine transitions, driver assignment, meal occurrence mirror.
- **Phase 6–7**: Notification quiet-hours filter, verified customer review verification.

---

## 9. Key Documentation Links

- [UI_DOCUMENTATION.md](./UI_DOCUMENTATION.md) — Screen-by-screen interaction design and visual tokens.
- [.agents/skills/information-density/SKILL.md](./.agents/skills/information-density/SKILL.md) — Information density guidelines and 20% pruning audit checklist.
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Monorepo architecture and data flows.
- [SUBSCRIPTION_ENGINE.md](./docs/SUBSCRIPTION_ENGINE.md) — Recurrence generator and occurrence lifecycle.
- [PAYMENTS.md](./docs/PAYMENTS.md) — eSewa gateway integration and financial ledger.

---

## 10. License

Private property of the GharKhana Product & Engineering Team. All rights reserved.
