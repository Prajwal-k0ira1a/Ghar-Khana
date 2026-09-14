# GharKhana — Security

## Document Control

| Field | Value |
|---|---|
| Status | v1.0 |
| Related docs | ARCHITECTURE.md, PAYMENTS.md §9, DATABASE.md |

## 1. Authentication

- Short-lived access tokens (15 minutes), long-lived refresh tokens with **rotation on every use** — a refresh token is single-use; reuse of an already-rotated token revokes the entire token family and forces re-login (defense against token theft/replay).
- Password hashing: **Argon2id** preferred, **bcrypt** (cost factor ≥ 12) acceptable fallback. Plaintext passwords are never logged, and are never present in `audit_logs`.
- Phone/email verification required before a `User` can create a `Subscription` or `Provider` profile (DOMAIN_MODEL.md §2).
- OTP-based login is rate-limited independently of password login (API_SPEC.md §19).

## 2. Authorization

Role-based authorization (`CUSTOMER`, `PROVIDER`, `DELIVERY_PARTNER`, `ADMIN`, `SUPER_ADMIN`). Every resource-scoped endpoint verifies **both** role and ownership — role alone is insufficient (e.g., a `CUSTOMER` role check must additionally confirm the requesting user owns the specific `Subscription` being accessed, not just that they hold the `CUSTOMER` role in general).

**Authorization checks happen at the query layer** (scoping the WHERE clause to the authenticated user's ID) rather than only filtering results after a broader fetch — this avoids a class of bugs where a broad query is fetched and filtering is forgotten on one code path.

## 3. Business Rule Security

The client is never trusted for: price, provider capacity, availability, cutoff, payment status, subscription status, or delivery status. These are recomputed and enforced server-side on every relevant mutation, regardless of what the client submits (ARCHITECTURE.md §17, SUBSCRIPTION_ENGINE.md §14).

## 4. Data Classification & Address Privacy

| Data class | Examples | Handling |
|---|---|---|
| Public | Provider display name, menu, ratings | No restriction |
| Restricted | Exact customer address, phone number, verification documents | Visible only to authorized parties, only while operationally necessary |
| Financial | Payment records, ledger entries | Restricted to owner + admin, immutable audit trail |
| Credentials | Password hashes, refresh tokens | Never exposed via any API response, ever |

Customer delivery addresses are restricted operational data:
- Customers cannot see other customers' addresses under any circumstance.
- Providers receive only the address information required for fulfillment, and only once a subscription with that provider is active — not during discovery/browsing.
- Delivery partners receive only the information required to complete their **currently assigned** delivery; access is not retained after delivery completion (DELIVERY.md §4).

## 5. Provider Verification Documents

- Stored in **private** object storage (never a public bucket).
- Accessible only to authorized staff (`ADMIN`/`SUPER_ADMIN`) via **expiring signed URLs** (short TTL, e.g., 10 minutes).
- Every access is audit-logged, including the admin identity and timestamp.

## 6. Payment Security

- GharKhana never stores raw card/wallet credentials (PAYMENTS.md §9); this keeps PCI-DSS scope at SAQ-A.
- Stored fields are limited to: transaction ID, gateway reference, amount, currency, status, timestamps.
- **Webhook signatures are always verified** against the gateway's shared secret/public key before any field in the payload is trusted — an unverified webhook is logged and discarded, never processed.
- All payment and refund operations are idempotent (PAYMENTS.md §7).

## 7. API Security (OWASP API Security Top 10 Mapping)

| OWASP API risk | GharKhana mitigation |
|---|---|
| Broken Object Level Authorization | Ownership check at query layer on every resource endpoint (§2) |
| Broken Authentication | Short-lived tokens, rotation, Argon2id/bcrypt, OTP rate limiting (§1) |
| Broken Object Property Level Authorization | Field-level allowlists on PATCH endpoints — clients cannot set server-authoritative fields (price, status) directly |
| Unrestricted Resource Consumption | Rate limiting per endpoint group (API_SPEC.md §19), pagination caps |
| Broken Function Level Authorization | Admin routes require explicit role check + are audit-logged (API_SPEC.md §18) |
| Unrestricted Access to Sensitive Business Flows | Idempotency keys + rate limits on subscription creation and payment initiation |
| Server-Side Request Forgery | No user-supplied URLs are fetched server-side without an allowlist (relevant for future webhook/URL-based features) |
| Security Misconfiguration | Security headers, CORS allowlist, no verbose stack traces in production error responses |
| Improper Inventory Management | API versioning policy (API_SPEC.md §2), deprecation windows documented |
| Unsafe Consumption of APIs | Payment gateway webhook payloads are schema-validated and signature-checked before use (§6) |

Additional baseline controls: HTTPS everywhere, input validation on every endpoint (shared Zod/Yup schemas from `packages/validation`), authentication middleware, authorization middleware, CORS allowlist, standard security headers (HSTS, X-Content-Type-Options, etc.), and API versioning.

## 8. Database Security

- Least-privilege database credentials per environment; the application role has no `DROP`/`ALTER` privileges in production.
- The `ledger_entries` table's application-facing role is granted `INSERT` only — no `UPDATE`/`DELETE` (DATABASE.md §13).
- Parameterized queries via the ORM (Drizzle ORM) — no raw string-concatenated SQL.
- Encrypted backups, encrypted at rest and in transit.
- No production credentials in source control — environment variables or a secrets manager only.
- Restricted network access (database not publicly reachable; accessible only from the application's network/VPC).

## 9. Secrets Management

Never committed to source control: JWT signing secrets, database passwords, payment gateway credentials, push notification credentials, object storage credentials. All are provided via environment variables in `local`/`staging`, and a secrets manager (e.g., cloud provider's native secrets service) in `production`.

## 10. Audit Logs

The following actions are always written to `audit_logs` (DATABASE.md §19), including actor identity, before/after state where applicable:

- Provider approval/rejection/suspension
- Subscription cancellation
- Refunds
- Payment status changes
- Role changes
- Address changes
- Any administrative action taken through the admin console

## 11. Abuse Prevention

Rate limits and suspicious-activity controls apply to: login, OTP requests, registration, provider registration, reviews, payment endpoints, and webhooks (API_SPEC.md §19 has concrete thresholds). Repeated failed OTP attempts on a phone number trigger a temporary lockout independent of IP-based limits, since OTP abuse is often distributed across IPs.

## 12. Threat Model Summary (STRIDE)

| Threat | Primary mitigation |
|---|---|
| Spoofing | Token-based auth, OTP/phone verification |
| Tampering | Server-side recomputation of all business-critical values (§3), signed webhooks (§6) |
| Repudiation | Immutable audit logs (§10), append-only ledger (§8) |
| Information Disclosure | Data classification & scoped access (§4), private object storage (§5) |
| Denial of Service | Rate limiting (§7, §11), pagination caps |
| Elevation of Privilege | Role + ownership checks at query layer (§2) |

## 13. Compliance Considerations

- Nepal does not yet have a comprehensive, dedicated data-protection statute equivalent to GDPR at the time of writing; GharKhana should nonetheless follow data-minimization and purpose-limitation principles (§4) as good practice and to de-risk future regulatory changes.
- If GharKhana expands beyond Nepal, data subject rights (access, deletion, portability) should be revisited against the destination market's law before launch there.
- PCI-DSS: SAQ-A scope, contingent on never handling raw payment credentials (§6, PAYMENTS.md §9) — this must be re-evaluated if any future feature (e.g., saved cards) changes that assumption.

## 14. Security Testing Cadence

| Activity | Cadence |
|---|---|
| Dependency vulnerability scanning (SCA) | Every CI run |
| Static analysis (SAST) | Every CI run |
| Manual security review of new auth/payment code paths | Every PR touching those modules |
| Third-party penetration test | Before public launch, then annually |

## 15. Incident Response (Baseline)

On a suspected security incident (data exposure, unauthorized access, payment anomaly): (1) contain — revoke affected tokens/credentials immediately, (2) assess scope using `audit_logs`, (3) notify affected users and relevant stakeholders per severity, (4) remediate root cause, (5) post-incident review documented and linked from this file. A fuller incident response runbook is a Phase 4+ deliverable owned by Engineering + Operations leads.
