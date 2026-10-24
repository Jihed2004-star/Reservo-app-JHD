# Reservo —  (Updated)

## Context
Reservo is a full-stack service booking marketplace built as an engineering internship deliverable. The platform is vertical-agnostic: browse Category → Service → Element, then book a specific Element via a calendar-based booking flow. This document reflects the **current, substantially-complete state** of the project — the original handoff (Steps 1-8 of frontend, backend "100% done for MVP core") has since been extended with a full Provider dashboard, a full Admin dashboard, Reviews, and several rounds of hardening fixes discovered through manual testing.

## Tech Stack
- **Backend:** .NET 10, ASP.NET Core, EF Core + Npgsql
- **Database:** PostgreSQL 18.1
- **Frontend:** React + Vite 7 + TypeScript, React Router, Axios, TanStack React Query, Tailwind CSS v4
- **Calendar:** FullCalendar (`core`, `react`, `daygrid`, `timegrid`, `interaction`)
- **Auth:** JWT Bearer tokens, 24h expiry, no refresh tokens (deliberate MVP simplification)

### Important tooling constraint
The project is pinned to **Vite 7**, not Vite 8. Vite 8 made Rolldown its default bundler, and FullCalendar's package `exports` field does not resolve cleanly under Rolldown's stricter module resolution — this caused real, reproducible build failures. Do not upgrade Vite without first confirming FullCalendar compatibility; this was a deliberate, tested decision, not an oversight.

## Repo structure
```
myapp/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── pages/              # One file per screen (~18 pages now, see below)
│       ├── components/         # Navbar (with role-based "Manage" dropdown), AuthLayout, ui/ (Badge, TagIcon, CardSkeleton, LogoMark), Footer
│       ├── api/                # catalog.ts, elements.ts, auth.ts, users.ts, reviews.ts
│       ├── context/             # AuthContext
│       └── types/               # catalog.ts (Category, Service, Element, BookingUnit types)
├── server/
│   ├── MyApp.Api/               # Controllers, DTOs, Services (JwtService)
│   └── MyApp.Data/              # Entities, AppDbContext, Migrations
```

## Data model (current)

**Actor hierarchy:** `User` (Customer/Provider/Admin via a plain string `Role` field) → Provider inherits Client booking capability → Admin inherits Provider capability. Browse is publicly accessible, no auth required (deliberate, confirmed decision).

**Entity hierarchy:** `Category` (Admin-managed) → `Service` (Provider-created) → `Element` (Provider-created, the actual bookable unit) → `Availability` (Provider-defined open windows) + `Booking` (Client reservations, references **Element**, not Service) → `Review` (tied to a specific completed Booking).

### Category
`Id, Name, Description, IsActive, CreatedAt`

### Service
`Id, CategoryId, ProviderId, Name, Description, IsActive, BookingUnit (enum: Hourly/Daily/Monthly, stored as string via HasConversion), CreatedAt`

### Element
`Id, ServiceId, Name, OrderIndex, Price, Attributes (Dictionary<string,string> → jsonb), IsActive`

### Availability
`Id, ElementId, TimeRange (tstzrange), CreatedAt`

### Booking
`Id, UserId, ElementId, TimeRange (tstzrange), Status (Confirmed/Cancelled — "Completed" is computed on read, not stored), CreatedAt`

### Review (new)
`Id, BookingId (unique — one review per booking), ElementId (denormalized for aggregate queries), UserId, Rating (1-5), Comment (nullable), CreatedAt`

## Key business rules and settled decisions

### Booking & Availability
- **Containment check is a multi-row coverage walk, not single-row containment.** Since `Generate` creates one Availability row per matching date, a multi-day Daily booking (e.g. "book July 22-24") must span several rows. `BookingsController.Create` walks all overlapping Availability rows in order, tracking continuous coverage, and confirms it reaches the requested end with no gaps.
- **Double-booking prevention is two-layered:** application-level containment check (is this time open at all) + a Postgres `EXCLUDE USING gist` constraint on `Booking` scoped to `(ElementId WITH =, TimeRange WITH &&) WHERE Status = 'Confirmed'` (is this time already taken — enforced atomically at the database level, immune to race conditions).
- **`BookingUnit` is a pure rendering hint**, never touched by backend logic. It only determines which FullCalendar view mounts (`timeGridWeek` for Hourly, `dayGridMonth` for Daily/Monthly).
- **Monthly is hidden from the "Create Service" UI** (though retained in the enum and still functions identically to Daily under the hood) — a genuinely distinct month-picker UX would require real additional scope; a multi-day Daily selection already covers the same functional need.
- **Full-day windows for Daily bookings:** the frontend signals "full day" by sending `startTime = endTime = 00:00:00`; the backend detects this exact pattern and rolls the end forward to midnight of the next day, producing a true 24-hour span rather than a zero-duration row.
- **Timezone handling:** all generated/stored times are explicitly `DateTime.SpecifyKind(..., DateTimeKind.Utc)` — Postgres's `tstzrange` refuses `Unspecified`-kind values. On the frontend, all-day calendar selections use FullCalendar's plain date strings (`info.startStr`) with a manually appended UTC midnight, avoiding the timezone shift that `.toISOString()` on a local-midnight `Date` object would introduce.
- **`/api/availability/generate` has an overlap guard**: before inserting, it fetches all existing Availability rows for the Element in one query and skips any candidate date whose range would overlap an existing row — prevents duplicate rows if a Provider re-runs Generate over an already-covered range. Response includes both `slotsCreated` and `slotsSkipped`.
- **Cancellation policy, now fully enforced server-side (not just hidden client-side):** a Client may cancel any Confirmed booking only *before its start time*. `BookingsController.Cancel` explicitly checks `TimeRange.LowerBound <= DateTime.UtcNow` and rejects with a clear message otherwise.
- **Booking status "Completed" is computed on read, not stored.** `Status` in the database only ever holds `"Confirmed"` or `"Cancelled"`. `MapToResponse` computes the effective status: `Cancelled` stays `Cancelled`; otherwise, if `TimeRange.UpperBound < DateTime.UtcNow`, the response reports `"Completed"`. No background job or scheduler needed for MVP scope.

### Delete vs. Deactivate (settled architectural decision, applies uniformly to Category/Service/Element)
- **Delete** = "this should never have existed." Only works on resources with zero real usage history — enforced by Postgres `RESTRICT` foreign keys (`Booking → Element`, `Service → Category`, etc.), which throw either SQLSTATE `23503` or `23001` depending on the exact constraint path (both are now caught consistently across all three controllers and returned as a clean `409`, not a raw 500).
- **Deactivate** (`IsActive` toggle) = "hidden from public browsing, history preserved." This is the everyday action once a resource has real data underneath it. Deactivating a Service hides its Elements from public browsing regardless of the Element's own `IsActive` flag (Service-inactive always wins). Public `GetAll`/`GetById` endpoints filter on `IsActive`; the owning Provider/Admin can still see and manage their own deactivated resources via role-aware endpoint variants (e.g. `ElementsController.GetById` allows the owner through even when inactive, returning 404 to everyone else).
- **Why Delete can never be extended to "cascade through history":** Booking rows are deliberately `RESTRICT`-protected so history is never silently lost. Since Category → Service → Element → Booking is a chain of foreign keys, any Category that ever had a genuinely-used Service transitively protects real Booking records several levels down — there is no schema change that resolves this without deliberately destroying booking history, which was rejected as unacceptable.

### Reviews (new feature)
- A Review requires a real, non-cancelled Booking whose end time has already passed — enforced server-side, not just client-side.
- One review per booking (application-level check + DB unique index as a safety net against races).
- Public read endpoints (`GET /api/reviews/by-element/{id}`, `GET /api/reviews/summary/{id}`) are anonymous — any visitor can see reviews and the aggregate rating without authentication.
- `ElementResponse` now carries `AverageRating`/`ReviewCount`, computed live from the Reviews table (no caching/denormalization yet — fine at current scale).

## What's fully built

### Backend
- Auth (register/login/me), JWT + role-based `[Authorize]`
- Full CRUD: Categories, Services, Elements, Availability, Bookings — all with ownership enforcement traced through parent relationships
- `/api/availability/generate` — bulk day-of-week pattern generation with overlap guard and full-day handling
- Public anonymized bookings endpoint (`GET /api/bookings/by-element/{id}`, no user info) vs. Provider-scoped real bookings endpoint (`GET /api/bookings/for-provider/{elementId}`, full detail, ownership-checked)
- `UsersController` — Admin-only user listing + role change with a self-demotion guard (no more manual SQL needed to create a Provider)
- Activate/deactivate endpoints (`PATCH .../toggle-active`) on Category, Service, and Element, each with correct cascading visibility
- `ReviewsController` — create (with eligibility checks), by-element list, rating summary, all described above
- Consistent, clean error handling for FK-violation deletes across all three levels (both Postgres `23503` and `23001` codes caught)

### Frontend — Client-facing
- Browse: Categories → Services → Elements, fully public
- `ElementDetail.tsx` — interactive two-layer FullCalendar (blue availability background, red booked-slot overlay), calendar legend, booking summary card, Reviews list + aggregate rating display
- `MyBookings.tsx` — booking list with Cancel (time-gated) and inline star-rating Review form for eligible past bookings
- Login/Register — redesigned to a new light theme (indigo/rose palette) based on a Figma reference, adapted to only include fields the backend actually supports (single Full Name field, no social login/remember-me/forgot-password/phone/terms checkbox — none had backend support, so none were built as dead UI)

### Frontend — Provider Dashboard
- `ProviderDashboard.tsx` (My Services list) → `CreateService.tsx` → `ManageService.tsx` (Elements list, add-Element form, Deactivate/Delete) → `ManageElement.tsx` (day-of-week availability generator form, FullCalendar view, real Bookings list with Cancel, Deactivate/Delete)

### Frontend — Admin Dashboard
- `UserManagement.tsx` — role dropdown per user, self-demotion blocked
- `CategoryManagement.tsx` — CRUD + Deactivate/Delete, same pattern as Service/Element

### Navigation
- `Navbar.tsx` redesigned with a role-aware "Manage" hover/click dropdown (replacing separate top-level Dashboard/Users/Categories links) — shows only the management pages relevant to the logged-in user's role, with hover-gap and click-outside handling fixed after initial UX issues.

## Running with Docker Compose
The whole stack — PostgreSQL, the ASP.NET API, the React build served by nginx, and Adminer — is containerised.

```bash
docker compose up --build      # first start: applies migrations, then seeds the admin
docker compose down            # stop, keep the database and uploads volumes
docker compose down -v         # stop and wipe both volumes
```

| Service | URL | Notes |
|---|---|---|
| Frontend | http://localhost:1234 | nginx, SPA fallback to `index.html` |
| API | http://localhost:8000 | Swagger at `/swagger` (Development only) |
| Adminer | http://localhost:8080 | server `postgres`; credentials from `.env` |
| PostgreSQL | `localhost:5433` | optional — for `psql`/DBeaver from the host |

Defaults: database `myapp` / `myapp_user` / `devpassword`; uploads live in the `uploads` volume mounted at `/app/wwwroot/uploads` (covers and galleries survive `down`). Copy `.env.example` to `.env` to override the JWT secret, admin credentials, ports or `VITE_API_URL`.

**Seeded administrator** — `AdminSeeder` runs on every API start and creates the account described by `Seed__Admin__Email` / `Seed__Admin__Password` / `Seed__Admin__FullName` (`ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` in compose). Defaults: `admin@reservo.local` / `Admin123!` — change these before exposing the stack. It is idempotent and non-destructive: an existing account is only re-promoted to `Role = Admin` / `IsActive = true`, so a password changed in the app is never reset by a restart.

`VITE_API_URL` is baked into the bundle at build time and is used by the **browser**, so it must be a URL published on the host (`http://localhost:8000/api`), never the internal `http://api:8080/api`.


## Known, deliberately deferred gaps
- No email/SMS notifications (would need real infrastructure beyond MVP scope)
- No search/filtering on browse pages (Categories/Services/Elements are list-only)
- No media beyond still images (element galleries accept PNG/JPG/WEBP/GIF, max 5 MB each, 8 per element)
- No sandbox/test-mode payment integration
- Docker Compose setup is demo-grade: one nginx container, no TLS, no reverse proxy or rate limiting
- No CI/CD pipeline

## Key learnings from this build phase (in addition to the original list)
- **EF Core property initializers (`= true`) do not become database column defaults.** A migration must explicitly call `.HasDefaultValue(true)` in `OnModelCreating`, or existing rows silently insert as the CLR default (`false` for `bool`) regardless of what the C# property declares. Hit this exact bug twice (Element.IsActive, then avoided it proactively for Category.IsActive).
- **Postgres reports RESTRICT violations under two different SQLSTATE codes** depending on the exact constraint path: `23503` (general foreign_key_violation) and `23001` (restrict_violation specifically). Error-catching helpers must check both, or some delete paths silently 500 instead of returning a clean message.
- **`.Overlaps()` (Npgsql/EF Core range method) only works inside SQL-translated queries** — calling it on an already-materialized in-memory `List<NpgsqlRange<T>>` throws an `InvalidOperationException` about client-evaluation. In-memory overlap checks must use manual comparison (`aStart < bEnd && bStart < aEnd`).
- **FullCalendar's `.toISOString()` on an all-day selection's `Date` object introduces a timezone shift** (local midnight → non-midnight UTC), which silently broke containment checks for Daily/Monthly bookings. Fixed by using FullCalendar's own plain date strings (`info.startStr`) with a manually appended UTC midnight instead.
- **Vite 8 defaults to the Rolldown bundler**, which has stricter package `exports` resolution than classic esbuild/Rollup Vite — this broke FullCalendar's subpath imports (`@fullcalendar/core/internal.js`, etc.) in a way that wasn't a version-mismatch problem, but a genuine Rolldown/FullCalendar incompatibility. Resolved by pinning to Vite 7.
- **Dropdown hover-gap bug:** a `margin` between a hover-trigger button and its dropdown menu creates a dead zone that breaks hover-intent on diagonal mouse movement; fixing this requires either closing the gap with `padding` inside the hoverable container (not `margin` outside it) or adding a short close-delay, ideally both together.

## Approach & patterns (unchanged, still holds)
- Exact diffs and targeted snippets preferred over full file regeneration, except for substantial rewrites (e.g. full page redesigns) where regenerating the whole file is clearer.
- Architectural decisions (Delete vs. Deactivate, BookingUnit as rendering-only, computed-not-stored Completed status) are settled deliberately and documented before implementation, with trade-offs stated explicitly.
- When handing off UI/UX work to a separate AI instance, backend logic, API contracts, and business rules are explicitly marked off-limits in the handoff brief.
