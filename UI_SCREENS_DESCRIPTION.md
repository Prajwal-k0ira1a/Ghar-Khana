# GharKhana — Complete UI Screens & Interaction Description

This document provides a comprehensive, screen-by-screen architectural description of every user interface in the **GharKhana** mobile application. 

The application is structured around the **Information Density — Calm UI Rule**:
> **"Show what matters now. Hide what can wait."**

Every screen is designed with a light editorial aesthetic (`#F8FAFC` background, `#FFFFFF` surfaces, hairline 1px `#E2E8F0` dividers, warm saffron `#F97316` primary accents, and cardamom green `#10B981` status tags), **zero emojis**, and strict compliance with the **3-Level Progressive Disclosure Hierarchy**.

---

## 📑 Table of Contents

1. [Global Design System & Navigation Architecture](#1-global-design-system--navigation-architecture)
2. [Entry & Gatekeeper](#2-entry--gatekeeper)
3. [Authentication Screens](#3-authentication-screens)
   - [3.1 Sign In (`login.tsx`)](#31-sign-in-logintsx)
   - [3.2 Sign Up (`register.tsx`)](#32-sign-up-registertsx)
4. [Customer (Consumer) Screens](#4-customer-consumer-screens)
   - [4.1 Daily Planner / Home (`home.tsx`)](#41-daily-planner--home-hometsx)
   - [4.2 Neighborhood Discovery (`discover.tsx`)](#42-neighborhood-discovery-discovertsx)
   - [4.3 Kitchen Profile & Menu (`provider-detail.tsx`)](#43-kitchen-profile--menu-provider-detailtsx)
   - [4.4 Subscription Checkout Flow (`subscribe.tsx`)](#44-subscription-checkout-flow-subscribetsx)
   - [4.5 My Meals Calendar & Cutoff Engine (`calendar.tsx`)](#45-my-meals-calendar--cutoff-engine-calendartsx)
   - [4.6 Notifications Center (`notifications.tsx`)](#46-notifications-center-notificationstsx)
   - [4.7 Customer Profile & Addresses (`profile.tsx`)](#47-customer-profile--addresses-profiletsx)
5. [Kitchen Provider Screens](#5-kitchen-provider-screens)
   - [5.1 Preparation Dashboard — Rule 18 (`dashboard.tsx`)](#51-preparation-dashboard--rule-18-dashboardtsx)
   - [5.2 Menu Catalog & Inventory (`menu.tsx`)](#52-menu-catalog--inventory-menutsx)
   - [5.3 Subscribers Roster (`subscriptions.tsx`)](#53-subscribers-roster-subscriptionstsx)
   - [5.4 Kitchen Profile, Capacity & Rules (`profile.tsx`)](#54-kitchen-profile-capacity--rules-profiletsx)
6. [Delivery Partner UI & Fulfillment Lifecycle](#6-delivery-partner-ui--fulfillment-lifecycle)
   - [6.1 Live Delivery Tracking Card (`DeliveryStatusCard.tsx`)](#61-live-delivery-tracking-card-deliverystatuscardtsx)
   - [6.2 State Machine Progression](#62-state-machine-progression)
7. [Core Information Density Principles Summary](#7-core-information-density-principles-summary)

---

## 1. Global Design System & Navigation Architecture

### Design Philosophy
- **Light & Editorial**: Soft grey-slate background (`#F8FAFC`) with pure white elevated surfaces (`#FFFFFF`). No harsh pure black dark modes or blinding contrast.
- **Hairline Dividers**: Replaced heavy drop shadows and decorative cards with 1px `#E2E8F0` dividers and natural typographic spacing.
- **Zero Emojis**: Automated zero-emoji enforcement across all labels, badges, buttons, and system messages. Replaced with clear typographic semantic tags (`CONFIRMED`, `CUSTOMIZED`, `SKIPPED`, `CUTOFF SOON`) and subtle outline icons from `lucide-react-native`.
- **Restrained Radii**: Strict geometric corner rounding (`xs: 2px`, `sm: 4px`, `md: 6px`, `lg: 8px`). Pill-shaped radii (`9999px`) are banned to avoid synthetic food-app appearances.
- **Touch Accessibility**: Every interactive touch target is ≥ 48dp (`Layout.minTouchTarget`).

### Navigation Hierarchy
- **Auth Stack** (`/(auth)`): Stack navigation for unauthenticated users (Login, Register).
- **Customer Tabs** (`/(customer)`): Fixed bottom navigation bar with 5 destinations:
  - `home` (Daily Planner)
  - `discover` (Kitchens Discovery)
  - `calendar` (14-Day Schedule)
  - `notifications` (In-App Alerts)
  - `profile` (Account & Preferences)
- **Provider Tabs** (`/(provider)`): Operational navigation bar with 4 destinations:
  - `dashboard` (Daily Batch Prep)
  - `menu` (Menu Catalog & Stock)
  - `subscriptions` (Subscriber Roster)
  - `profile` (Kitchen Settings & Capacity)

---

## 2. Entry & Gatekeeper

### 2.1 Route Gatekeeper (`apps/mobile/app/index.tsx`)
- **File**: [`apps/mobile/app/index.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/index.tsx)
- **Primary Function**: Inspects session persistence via `useAuthStore` and automatically routes the user:
  - **Unauthenticated**: Redirects to `/splash` for the 3-step onboarding walkthrough.
  - **Customer Role**: Redirects to `/(customer)/home`.
  - **Provider Role**: Redirects to `/(provider)/dashboard`.
- **Visuals**: A clean, quiet loading indicator centered on `#F8FAFC`.

### 2.2 3-Step Splash & Onboarding Tour (`apps/mobile/app/splash.tsx`)
- **File**: [`apps/mobile/app/splash.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/splash.tsx)
- **Primary Purpose**: Welcomes users with a calm, 3-level progressive introduction before authentication. Allows instant jumping to any slide or skipping directly to Login.
- **Screen 1 of 3**: **Authentic Home Kitchens**
  - Subtitle: *Cooked fresh every morning in your neighborhood*
  - Key highlights: Verified hygiene standards and wholesome home recipes with local ingredients.
  - Visual: Saffron UtensilsCrossed emblem.
- **Screen 2 of 3**: **Flexible Meal Subscriptions**
  - Subtitle: *You stay in full control of your weekly schedule*
  - Key highlights: 10:30 AM daily cutoff rule for free swaps/skips, and `Subscription ≠ Meal Order` philosophy.
  - Visual: Saffron CalendarCheck emblem.
- **Screen 3 of 3**: **Hot Tiffin at Your Door (Splash Screen 3)**
  - **Primary Question**: *"When and how will my meals be delivered?"*
  - **Primary Action (CTA)**: `[Get Started]` (routes to `/(auth)/register`) + `[Sign In]` secondary link.
  - **Level 1 (NOW)**:
    - **12:30 – 1:15 PM Window**: Guaranteed meal arrival before lunch break.
    - **Live Occurrence Tracking**: End-to-end visibility from cooking to courier handover with OTP verification.
    - **Direct Link**: Can be launched directly via `/splash?step=3`.
  - **Visual**: Cardamom green Truck emblem and double verification badges.

---

## 3. Authentication Screens

### 3.1 Sign In (`login.tsx`)
- **File**: [`apps/mobile/app/(auth)/login.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/(auth)/login.tsx)
- **Primary Question**: *"How do I sign in to my account?"*
- **Primary Action (CTA)**: `[Sign In]`
- **Key Elements**:
  - **Header**: Editorial typography: `GharKhana`, subtitle: `Daily home-cooked meal management`.
  - **Input Fields**: Clean text inputs with labels placed directly above fields:
    - `Email or Phone Number` (e.g., `+977 9800000001` or `customer@gharkhana.app`).
    - `Password` (with secure text entry toggle).
  - **Quick Demo Shortcuts**: Two one-tap pre-fill buttons allowing instant testing without manual typing:
    - `Demo Customer` (`customer@gharkhana.app`)
    - `Demo Provider` (`provider@gharkhana.app`)
  - **Footer Action**: Clear link to `Register for an account`.

### 3.2 Sign Up (`register.tsx`)
- **File**: [`apps/mobile/app/(auth)/register.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/(auth)/register.tsx)
- **Primary Question**: *"How do I create a new customer or kitchen account?"*
- **Primary Action (CTA)**: `[Create Account]`
- **Key Elements**:
  - **Role Segmented Switcher**: Simple toggle between `Customer` and `Kitchen Provider`.
  - **Common Credentials**: Full Name, Nepali Phone (+977 prefix), Email Address, and Password (min 8 characters).
  - **Customer Specific**: Primary neighborhood drop-off zone (e.g. Kathmandu Core, Lalitpur, Baneshwor).
  - **Provider Specific**: Kitchen Brand Name (e.g. *Sita's Kitchen*) and daily meal capacity estimate.
  - **Validation & Error Handling**: Inline red validation messages without blocking popups.

---

## 4. Customer (Consumer) Screens

### 4.1 Daily Planner / Home (`home.tsx`)
- **File**: [`apps/mobile/app/(customer)/home.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/(customer)/home.tsx)
- **Primary Question**: *"What am I eating today?"*
- **Primary Action (CTA)**: `[Change meal]`
- **Information Hierarchy**:
  - **Level 1 (NOW — Visible Immediately)**:
    - Date Header: Clean typographic format (e.g., `WEDNESDAY, SEP 23`).
    - Today's Meal Banner:
      - Meal Slot & Kitchen: `Lunch · Sita's Home Kitchen`.
      - Dish Title: `Classic Dal Bhat Tarkari`.
      - Delivery Window: `12:30 PM – 1:15 PM`.
      - Status Tag: `PREPARING` (cardamom green background).
      - Cutoff Warning: `Changes lock at 10:30 AM`.
      - CTA: `[Change meal]` button.
  - **Level 2 (SOON — Secondary Section)**:
    - Upcoming 3-Day Schedule: Compact list preview of tomorrow, Friday, and Saturday with dish name and status.
    - Direct text link: `[View full 14-day schedule]`.
- **Anti-Clutter Pruning**: Removed card nesting, badge spam, multi-line marketing text, and kitchen analytics.

---

### 4.2 Neighborhood Discovery (`discover.tsx`)
- **File**: [`apps/mobile/app/(customer)/discover.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/(customer)/discover.tsx)
- **Primary Question**: *"Which kitchen fits my daily routine and neighborhood?"*
- **Primary Action (CTA)**: Tap any kitchen row to open its profile.
- **Information Hierarchy**:
  - **Search Bar**: Crisp border input with search icon.
  - **Filter Tabs**: Simple text chips (`All Kitchens`, `Lunch Plans`, `Dinner Plans`, `Pure Vegetarian`).
  - **Kitchen List Items (Rule 5 Compliant)**:
    - Exactly **1 primary piece of information**: Kitchen Name (e.g., `Sita's Home Kitchen`).
    - Exactly **2–3 supporting details**:
      - Line 1: `Home kitchen · 1.8 km away`.
      - Line 2: `From NPR 180 / meal · 4.8 rating`.
  - **Dividers**: Separated by 1px hairline `#E2E8F0` borders instead of heavy elevated cards.
  - **Level 3 (DETAILS)**: Opening the kitchen exposes detailed certifications, capacity status, full reviews, and operating hours.

---

### 4.3 Kitchen Profile & Menu (`provider-detail.tsx`)
- **File**: [`apps/mobile/app/provider-detail.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/provider-detail.tsx)
- **Primary Question**: *"What does this kitchen prepare and can I trust them?"*
- **Primary Action (CTA)**: `[Subscribe to Kitchen]`
- **Information Hierarchy**:
  - **Header**: Quiet back arrow, Kitchen Title, Verified Home Kitchen tag, rating (`4.8 from 36 reviews`), and service radius (`4 km`).
  - **Menu Tab Switcher**: Segmented toggle between `Lunch` and `Dinner`.
  - **Dish Catalog**:
    - Dish Name (e.g. `Special Chicken Thali`).
    - Dietary tag: `NON-VEGETARIAN` or `VEGETARIAN`.
    - Concise description: `Traditional chicken curry, steamed rice, dal, and fresh salad`.
    - Price: `NPR 350 / meal`.
  - **Sticky Bottom Action Bar**: Prominently shows starting price and a full-width `[Subscribe to Kitchen]` button.

---

### 4.4 Subscription Checkout Flow (`subscribe.tsx`)
- **File**: [`apps/mobile/app/subscribe.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/subscribe.tsx)
- **Primary Question**: *"How do I set up my recurring delivery days and pay?"*
- **Primary Action (CTA)**: `[Continue to Step 2]` ➔ `[Review & Pay]` ➔ `[Pay with eSewa]`
- **3-Step Wizard Structure**:
  1. **Step 1 — Meal Plan & Schedule**:
     - Cycle selector: `Weekly (7 Days)` or `Monthly (30 Days)`.
     - Meal Slot: `Lunch` or `Dinner`.
     - Delivery Days: Checkboxes for `Sun`, `Mon`, `Tue`, `Wed`, `Thu`, `Fri` (Saturday optional).
  2. **Step 2 — Delivery Location & Pricing**:
     - Delivery Address: Saved address picker + Landmark instructions input.
     - Transparent Cost Breakdown:
       - Base Meal Cost (e.g., 24 meals × NPR 220 = NPR 5,280).
       - Platform & Delivery Fee (NPR 150).
       - Monthly Discount (-NPR 200).
       - **Total Due**: `NPR 5,230`.
  3. **Step 3 — Payment Gateway**:
     - Gateway options: `eSewa Mobile Wallet` (Instant authorization) or `Cash on Trial`.
     - 10:30 AM Cutoff Guarantee notice: *"You can pause or skip individual meals anytime before 10:30 AM for a full ledger credit."*

---

### 4.5 My Meals Calendar & Cutoff Engine (`calendar.tsx`)
- **File**: [`apps/mobile/app/(customer)/calendar.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/(customer)/calendar.tsx)
- **Primary Question**: *"What meals are scheduled for the next 14 days and can I swap or skip?"*
- **Primary Action (CTA)**: `[Change dish]` or `[Skip this day]`
- **Information Hierarchy**:
  - **Date Selector**: Horizontal row of calendar day chips (`Mon 22`, `Tue 23`, `Wed 24`...) with dot indicators for scheduled meals.
  - **Selected Occurrence Card**:
    - Date & Meal Slot: `Thursday, Sep 24 · Lunch`.
    - Dish: `Classic Dal Bhat Tarkari`.
    - Kitchen: `Sita's Kitchen`.
    - Live Delivery Tracking Card integration.
  - **Cutoff Rules Engine**:
    - **Before 10:30 AM Cutoff**:
      - `[Change dish]`: Opens bottom modal to pick an alternative dish from the kitchen's active menu.
      - `[Skip this meal]`: Marks meal as `SKIPPED` without penalty and credits balance.
    - **After 10:30 AM Cutoff**:
      - Action buttons automatically disabled.
      - Displays informational banner: `Locked — Preparation batch has started for today.`

---

### 4.6 Notifications Center (`notifications.tsx`)
- **File**: [`apps/mobile/app/(customer)/notifications.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/(customer)/notifications.tsx)
- **Primary Question**: *"Are there any urgent updates about today's meal, cutoff, or delivery?"*
- **Primary Action (CTA)**: `[Mark all read]`
- **Layout & Structure**:
  - Flat list with 1px dividers (no card stacking).
  - Unread items visually highlighted with bolder typography and subtle left accent bar.
  - Notification Types:
    - `CUTOFF`: *"10:30 AM cutoff in 30 minutes for today's lunch."*
    - `DELIVERY`: *"Your lunch has been picked up by Driver Bikash."*
    - `PAYMENT`: *"Weekly subscription payment received via eSewa."*
  - Strict quiet-hours compliance (no non-urgent notifications between 10 PM and 6 AM).

---

### 4.7 Customer Profile & Addresses (`profile.tsx`)
- **File**: [`apps/mobile/app/(customer)/profile.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/(customer)/profile.tsx)
- **Primary Question**: *"How do I manage my delivery addresses, account, and subscriptions?"*
- **Primary Action (CTA)**: Tap any setting row to edit.
- **Layout & Structure**:
  - **Account Header**: Customer name, phone number, and verified status tag.
  - **Settings Sections** (grouped cleanly with dividers):
    - `Saved Delivery Addresses` (Office, Home, Landmark notes).
    - `Active Subscriptions` (Manage or pause recurring agreements).
    - `Dietary Preferences` (Vegetarian default, allergen alerts).
    - `Payment History & eSewa Receipts`.
    - `Help & Support`.
    - `Sign Out` (cleans session and redirects to Login).

---

## 5. Kitchen Provider Screens

### 5.1 Preparation Dashboard — Rule 18 (`dashboard.tsx`)
- **File**: [`apps/mobile/app/(provider)/dashboard.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/(provider)/dashboard.tsx)
- **Primary Question**: *"What am I cooking right now?"*
- **Primary Action (CTA)**: `[Start preparing]` ➔ `[Mark ready for delivery]`
- **Implementation of Rule 18**:
  - Strictly presents the operational batch summary without clutter:
    ```text
    TODAY'S PREPARATION
    36 portions

    Dal Bhat Tarkari       24
    Chicken Thali          12

    [Start preparing]
    ```
  - **State Transition**:
    - Tapping `[Start preparing]` advances the batch state to `PREPARING` and updates all customer occurrences simultaneously.
    - Once cooked, the button transforms into `[Mark ready for delivery]` to alert neighborhood delivery partners.
  - **Secondary Action**: Subtle link to `[View subscriber delivery list]` to see customer-level names and addresses only when needed.
  - **Pruned Elements**: Removed revenue stats, individual subscriber cards, and complex analytics from the cooking view.

---

### 5.2 Menu Catalog & Inventory (`menu.tsx`)
- **File**: [`apps/mobile/app/(provider)/menu.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/(provider)/menu.tsx)
- **Primary Question**: *"What dishes are active and available for tomorrow's orders?"*
- **Primary Action (CTA)**: `[Add New Dish]`
- **Layout & Structure**:
  - Table of dishes with meal slot badge (`LUNCH` / `DINNER`).
  - Dish name, price in NPR, and dietary classification.
  - **Instant Live Stock Switch**: A single toggle to mark a dish in/out of stock. If marked out of stock, customers cannot select it for upcoming schedules.
  - **Add/Edit Modal**: Clean sheet to input dish name, description, ingredients, price, and meal window.

---

### 5.3 Subscribers Roster (`subscriptions.tsx`)
- **File**: [`apps/mobile/app/(provider)/subscriptions.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/(provider)/subscriptions.tsx)
- **Primary Question**: *"Who are my recurring daily customers and where do their meals go?"*
- **Primary Action (CTA)**: Tap customer row to view address details or phone call shortcut.
- **Layout & Structure**:
  - Roster of active subscribers separated by clean dividers.
  - Displays: Customer Name, Plan (`Monthly Lunch`), Delivery Days (`Sun–Fri`), Portions (`1 portion`), and Neighborhood Zone (`New Road`).
  - Verification tag showing advance payment status.

---

### 5.4 Kitchen Profile, Capacity & Rules (`profile.tsx`)
- **File**: [`apps/mobile/app/(provider)/profile.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/app/(provider)/profile.tsx)
- **Primary Question**: *"How do I adjust my kitchen's capacity limits and operational rules?"*
- **Primary Action (CTA)**: `[Update Capacity Limits]`
- **Layout & Structure**:
  - Operational KPIs: Hygiene certification score, completed meals count, active subscribers.
  - **Daily Capacity Inputs**: Maximum meals the kitchen can cook per slot (e.g., Lunch: 40, Dinner: 30). Prevents over-subscription.
  - **Policy Disclosures**: Explains the 10:30 AM cutoff rule, 10% platform commission, and 4 km delivery radius.

---

## 6. Delivery Partner UI & Fulfillment Lifecycle

### 6.1 Live Delivery Tracking Card (`DeliveryStatusCard.tsx`)
- **File**: [`apps/mobile/src/components/DeliveryStatusCard.tsx`](file:///c:/Users/PRAJWAL%20KOIRALA/Downloads/GharKhana/apps/mobile/src/components/DeliveryStatusCard.tsx)
- **Primary Question**: *"Where is the meal right now and what is the next action?"*
- **Integrated View**: Embedded inside Customer Home and Calendar screens.
- **Elements Displayed**:
  - Delivery Status Tag (`SCHEDULED`, `PREPARING`, `PICKED_UP`, `DELIVERED`).
  - Delivery Partner Name & Phone (when assigned).
  - Estimated Delivery Time window (e.g. `12:45 PM – 1:15 PM`).
  - Delivery Address & Landmark preview.

---

### 6.2 State Machine Progression

The delivery lifecycle follows an immutable 4-stage operational progression:

```text
[1. SCHEDULED]
Waiting for 10:30 AM cutoff lock and kitchen batch start.
Next Action: Kitchen starts prep.

     │
     ▼

[2. PREPARING]
Kitchen is cooking the batch. Delivery partner assigned.
Next Action: Driver arrives at kitchen for pickup.

     │
     ▼

[3. PICKED UP / IN TRANSIT]
Meal collected from home kitchen. Driver en route to customer address.
Next Action: Driver arrives at customer destination.

     │
     ▼

[4. DELIVERED]
Customer receives meal. Verified via OTP or delivery partner photo confirmation.
Next Action: Occurrence completed; customer invited to leave a review.
```

---

## 7. Core Information Density Principles Summary

Every screen in the GharKhana application satisfies the following design invariants:

| Rule | Implementation Requirement |
| :--- | :--- |
| **One Question per Screen** | Every screen has a single purpose. Home = *"What am I eating today?"*; Provider = *"What am I cooking right now?"*. |
| **The 3-Second Test** | A user scanning any screen for 3 seconds immediately knows where they are, what is important, and what action to take. |
| **3-Level Hierarchy** | Level 1 (NOW) visible immediately. Level 2 (SOON) below fold. Level 3 (DETAILS) behind explicit tap/modal. |
| **Anti-Card Stacking** | No floating cards stacked inside other cards. Structure is achieved using whitespace and 1px `#E2E8F0` dividers. |
| **Zero Emoji Policy** | Strict 0-emoji rule across all files, badges, and copy. Semantic text badges replace emojis. |
| **Single Primary CTA** | Exactly one prominent button per screen. Secondary actions are subtle or text links. |
| **No Over-Labelling** | Labels like `MEAL:`, `TIME:`, `STATUS:` are banned; clear typographic scale communicates meaning naturally. |
| **20% Pruning Check** | Prior to release, each screen is audited to remove 20% of non-essential elements to maintain maximum clarity. |

---

*Document version: 2.0 (Post-Information Density & Calm UI Redesign)*  
*Platform: GharKhana Mobile (React Native / Expo Router v3)*
