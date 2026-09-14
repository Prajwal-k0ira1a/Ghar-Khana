# GharKhana — Notifications

## Document Control

| Field | Value |
|---|---|
| Status | v1.0 |
| Related docs | DOMAIN_MODEL.md §21, ARCHITECTURE.md §7 |

## 1. Channels

| Channel | Availability |
|---|---|
| Push (Expo Notifications) | MVP |
| In-app notification center | MVP |
| Email | Future |
| SMS | Future — likely important for OTP and low-connectivity users in Nepal |
| WhatsApp | Future |

## 2. Customer Notifications

| Event | Priority | Deep link target |
|---|---|---|
| Subscription created | Normal | Subscription detail |
| Payment confirmed | High | Subscription detail |
| Subscription activated | High | Subscription calendar |
| Subscription paused | Normal | Subscription detail |
| Subscription resumed | Normal | Subscription detail |
| Subscription cancelled | High | Subscription detail |
| Upcoming meal reminder | Normal | Subscription calendar, date focused |
| Meal customized (confirmation) | Low | Meal detail |
| Meal skipped (confirmation) | Low | Meal detail |
| Modification cutoff approaching | Normal | Meal detail |
| Meal being prepared | Low | Meal detail |
| Meal out for delivery | Normal | Delivery detail |
| Meal delivered | Low | Meal detail |
| Payment successful | High | Payment receipt |
| Payment failed | High | Payment retry screen |
| Refund processed | High | Payment detail |

## 3. Provider Notifications

| Event | Priority | Deep link target |
|---|---|---|
| New subscription | High | Provider subscription detail |
| Subscription cancellation | High | Provider subscription detail |
| Meal customization by customer | Normal | Provider meal detail |
| Daily preparation summary | High | Provider dashboard |
| Upcoming preparation reminder | Normal | Provider dashboard |
| Delivery pickup confirmation | Low | Provider meal detail |
| Payment / payout update | High | Provider earnings |

## 4. Delivery Partner Notifications

| Event | Priority | Deep link target |
|---|---|---|
| New assignment | High | Delivery detail |
| Pickup reminder | Normal | Delivery detail |
| Customer delivery details available | Normal | Delivery detail |
| Delivery status update (reassignment/cancellation) | High | Delivery list |

## 5. Notification Rules

Notifications must be:

- **Relevant** — scoped to the recipient's own data; a notification payload never contains another user's data (SECURITY.md §4).
- **Idempotent** — the same underlying event, processed twice by a retried job, produces at most one delivered notification. Enforced by a dedup key of `(userId, eventType, referenceId)` checked before insert.
- **User-specific** — driven by `Notification.userId`, never broadcast without a recipient list.
- **Privacy-aware on lock screens** — high-sensitivity content (e.g., exact delivery address, payment amounts) is not required in the push preview text; the preview stays generic ("Your meal is on the way") and detail loads only after the user opens the app and is authenticated.

## 6. Delivery Guarantee & Retry

Push delivery is **at-least-once, best-effort** (Expo's push service does not guarantee delivery). The `notifications` table (in-app center) is the durable record — a missed push should never mean a user has no way to see the event; it will still appear in the notification center on next app open.

Failed push sends (e.g., invalid/expired `DeviceToken`) are retried with exponential backoff up to a small cap (e.g., 3 attempts), after which the token is marked stale and pruned rather than retried indefinitely.

## 7. Scheduling

Background workers (BullMQ, ARCHITECTURE.md §7) create scheduled notification jobs — e.g., "meal reminder" jobs are enqueued at occurrence-generation time with a `runAt` a configurable number of hours before the scheduled meal, not computed ad hoc at send time.

Avoid duplicate notifications if the same event is processed multiple times (see §5 idempotency).

## 8. Quiet Hours

`NORMAL` and `LOW` priority notifications should not be pushed between 22:00–07:00 `Asia/Kathmandu` and are instead queued for delivery at the next allowed window. `HIGH` priority notifications (payment failures, subscription cancellations, delivery issues) are exempt from quiet hours.

## 9. Deep Links

Notifications open the relevant screen directly rather than a generic home screen:

```text
Meal reminder            → Subscription calendar (focused on that date)
Provider: new subscription → Provider subscription detail
Delivery update            → Delivery detail
Payment failed               → Payment retry screen
```

## 10. Localization

Notification copy is stored as templates keyed by `type` + locale, not hardcoded per call site, so that an English/Nepali toggle (PRD.md §10 non-functional requirement) can be added without touching job logic — only the template lookup.

## 11. User Preferences (Phase 6+)

At MVP, all `HIGH` and `NORMAL` priority categories are on by default and not user-configurable beyond a global push on/off toggle in device settings. Granular per-category notification preferences are a post-MVP enhancement once real usage data shows which categories users actually want to mute.
