# System Flow (Auth → Users → Reminders with AI & BullMQ)

This document describes the end-to-end flow: user onboarding & auth -> protected API usage -> reminder parsing (heuristic + LLM) -> persistence -> scheduling -> notification delivery.

---

## 0) Environment & Runtime Assumptions

- **Auth**: JWT (access/refresh), `requireAuth` middleware, `bearerAuth` in OpenAPI.
- **DB**: Primary relational DB (Prisma) for users & details. DynamoDB is used for other entities if configured.
- **Queues**: BullMQ (Redis wire protocol). In dev/test, queues can be disabled with `BULL_DISABLED=true`.
- **Configs**:
  - `TRUST_PROXY` properly set (e.g. `1` on Render, `0` locally).
  - `OPENAI_API_KEY` optional (enables LLM parse enrichment).
  - Rate limit, slowdown, CORS enabled.
- **Docs**: OpenAPI modular (`/src/docs/**`).

---

## 1) Sign Up / Login / Token Refresh

```text
[Client / UI]
   |
   | 1) POST /api/auth/signup      (email, password, name)
   |    → creates user (Prisma) + returns 201 (no tokens or auto-login depends on policy)
   |
   | 2) POST /api/auth/login       (email, password)
   |    → returns { accessToken (short TTL), refreshToken (longer TTL) }
   |
   | 3) (subsequent calls) Authorization: Bearer <accessToken>
   |
   | 4) POST /api/auth/refresh     (with refreshToken)
   |    → returns new { accessToken, refreshToken } on success
   |
   | 5) POST /api/auth/logout      (invalidates refresh if stored/blacklisted)
```

**Notes**
- `requireAuth` checks the Access JWT. If expired, client should call `/refresh`.
- Rate limit is applied to auth routes to prevent brute force.
- CORS configured via `CORS_ORIGINS`, credentials optional.

---

## 2) Users & UserDetails

Typical onboarding includes populating user profile details:

```text
[Client / UI]
   |
   | 1) GET  /api/users/me          (requires bearer token)
   | 2) GET  /api/users/{id}/details
   | 3) POST /api/users/{id}/details
   | 4) PATCH/DELETE /api/users/{id}/details
```

Data is persisted via Prisma in the relational DB. OpenAPI exposes schemas:
- `User`, `CreateUserInput`, `PatchUserInput`, etc.
- `UserDetails`, `CreateUserDetailsInput`, `PatchUserDetailsInput`

---

## 3) Reminders Parsing & Creation (with AI)

### High-level diagram

```text
[Client / UI]
   |
   | 1) POST /api/reminders/parse   (NL → suggested payload)
   v
[API Reminders Controller]
   |
   |-- Validate with Zod (ParseReminderSchema)
   v
[Parse Orchestrator]
   |\
   | \-- A) Heuristic (chrono + rules) → baseline
   |  \
   |   \-- B) LLM (if OPENAI_API_KEY) → JSON (timeout + error handling)
   |         |
   |         |-- Validate/sanitize LLM output (Zod + type-guards)
   |         v
   |       merge(baseline, llm)  ← prefer LLM fields when present
   v
[Parse Response]
   → { title, dueAtISO?, rrule?, channel?, category?, confidence, ... }
```

**Notes**
- If LLM is unavailable or fails, the **heuristic** result is returned (safe fallback).
- `exactOptionalPropertyTypes` is respected (no unsafe assignments).
- Channel validation uses a typed whitelist (`'EMAIL'|'WHATSAPP'|'SMS'`).

---

## 4) Persisting & Scheduling Reminders

```text
[Client / UI]
   |
   | 2) POST /api/reminders  (confirmed payload from parse step)
   v
[API Reminders Controller]
   |
   |-- Validate body with Zod (CreateReminderSchema)
   v
[Reminder Service]
   |\
   | \ 3a) Persist in DB                   ─────────► [DB (Reminders)]
   |  \
   |   \ 3b) Enqueue scheduled job (BullMQ) ────────► [Redis Queue (BullMQ)]
   |                                              (in dev/test: Noop if BULL_DISABLED=true)
   v
[BullMQ Scheduler]
   |
   | 4) Trigger job at dueAt / rrule
   v
[Worker / Notifier]
   |
   | 5) Send notification (Email / WhatsApp / SMS)
   v
[User receives notification]
```
