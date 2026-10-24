# Implementation Guide — Sidebar / Overview / Settings

> Generated on 2026-10-18 — tools, techs and all changes for the sidebar redesign + Overview & Settings pages.

---

## 1. Request Summary

- Redesign the **Sidebar** to the beige/brown “Reservo” mock (light bg, rounded nav items, role badge, bottom user card with logout).
- Add **Overview** page (`/overview`) — personalised dashboards / stats for the logged-in user.
- Add **Settings** page (`/settings`) with three sections:
  1. **Profile** — change `fullName`, `email`, optional `phoneNumber`
  2. **Security** — change password (current + new)
  3. **Danger zone** — deactivate own account (only Admin can re-activate)

---

## 2. Tech Stack

### Backend — `server/`
| Layer | Tech |
|---|---|
| Runtime | **.NET 10** (ASP.NET Core Web API), `net10.0` |
| ORM | **EF Core** + **Npgsql** (PostgreSQL) |
| Auth | **JWT Bearer** (`Microsoft.AspNetCore.Authentication.JwtBearer`) + custom `JwtService` (HMAC-SHA256, `Jwt:Secret`/`Issuer`) |
| Passwords | **BCrypt.Net-Next** (`HashPassword`/`Verify`) |
| DTOs | Manual, no AutoMapper |
| Docs | **Swashbuckle Swagger** (Bearer scheme) |
| Migrations | `dotnet ef migrations add … --project MyApp.Data` |

### Frontend — `client/`
| Layer | Tech |
|---|---|
| Build | **Vite 7** + `@vitejs/plugin-react` + `TypeScript 6` |
| Framework | **React 19** + **react-router-dom 7** |
| Data | **@tanstack/react-query 5** (`useQuery`/`useMutation`) |
| HTTP | **axios 1.x** (`api/client.ts` JWT interceptor) |
| Styling | **Tailwind CSS 4** (`@tailwindcss/vite`), palette `#fcfcfd`/`#ede9df`/`#1a1a1a` |
| Calendar | **FullCalendar** (existing) |
| Lint | **oxlint** |

### Tooling for this task
VS Code, `dotnet build` / `dotnet ef`, `npm --prefix client run build` / `tsc -b`, Python one-liners for file gen & BOM fix.

---

## 3. What Was Done — File by File

### 3.1 Data Model

**`server/MyApp.Data/Entities/User.cs`**
```csharp
public string? PhoneNumber { get; set; }   // NEW — optional text
public bool IsActive { get; set; } = true; // NEW — deactivation flag
```

**Migration `20261018193719_AddUserPhoneAndIsActive`**
```csharp
AddColumn<bool>(name: "IsActive", table: "Users", type: "boolean", nullable:false, defaultValue:true);
AddColumn<string>(name: "PhoneNumber", table: "Users", type: "text", nullable:true);
```
- `AppDbContextModelSnapshot.cs` auto-updated.
- **Build fix**: file initially had double UTF-8 BOM (`c3 af c2 bb c2 bf` instead of `ef bb bf`) causing `CS1001/CS1056`; stripped and rewrote with single BOM — `dotnet build` now succeeds.

### 3.2 DTOs

| File | Purpose |
|---|---|
| `DTOs/MeResponse.cs` | `GET /api/auth/me`, `PUT /api/auth/profile` → `{ id, email, fullName, role, phoneNumber?, isActive, createdAt }` |
| `DTOs/UpdateProfileRequest.cs` | `{ fullName, email, phoneNumber? }` |
| `DTOs/ChangePasswordRequest.cs` | `{ currentPassword, newPassword }` |
| `DTOs/OverviewResponse.cs` + `OverviewStats` | Aggregated overview payload |

**Updated** `DTOs/UserResponse.cs` — added `PhoneNumber?` + `IsActive`.

### 3.3 AuthController — `server/MyApp.Api/Controllers/AuthController.cs`

| Route | Auth | Logic |
|---|---|---|
| `POST /api/auth/register` | anon | unchanged (IsActive=true) |
| `POST /api/auth/login` | anon | NEW: 401 if !IsActive before JWT |
| `GET /api/auth/me` | Auth | NEW: parses NameIdentifier/sub, returns MeResponse |
| `PUT /api/auth/profile` | Auth | NEW: validates fullName/email, unique email, trims phone, UpdatedAt |
| `POST /api/auth/change-password` | Auth | NEW: newPassword >=6, Verify current, re-hash |
| `POST /api/auth/deactivate` | Auth | NEW: IsActive=false for self; 400 if already inactive |

### 3.4 OverviewController — `server/MyApp.Api/Controllers/OverviewController.cs` (NEW)

`GET /api/overview` — `[Authorize]`:
1. Resolve userId from claims, load User.
2. Load Bookings for user with `Include(Element.Service)`, ordered CreatedAt desc.
3. Compute total/upcoming (UpperBound>now && Confirmed)/completed/cancelled.
4. Map to BookingResponse (Cancelled/Completed/original).
5. recent=Take(5), upcomingBookings=Where(LowerBound>now && Confirmed).Take(5).
6. If Provider/Admin: load Services+Elements, aggregate servicesCount/elementsCount, avg rating from Reviews.
7. Return `OverviewResponse { user, stats, recentBookings, upcomingBookings, myServices }`.

### 3.5 UsersController — `server/MyApp.Api/Controllers/UsersController.cs`

- `GET /api/users` now projects PhoneNumber+IsActive.
- NEW `PATCH /api/users/{id}/toggle-active` — Admin only, flips IsActive, blocks self-toggle (400), returns UserResponse.
- `PATCH /api/users/{id}/role` now also returns PhoneNumber/IsActive.



### 3.3 AuthController

| Route | Auth | Logic |
|---|---|---|
| POST /api/auth/register | anon | unchanged (IsActive=true) |
| POST /api/auth/login | anon | NEW: 401 if !IsActive |
| GET /api/auth/me | Auth | NEW: returns MeResponse from JWT claims |
| PUT /api/auth/profile | Auth | NEW: validates fullName/email, unique email, trims phone, UpdatedAt |
| POST /api/auth/change-password | Auth | NEW: newPassword>=6, Verify current, re-hash |

### 3.6 Frontend — Sidebar `client/src/components/Sidebar.tsx`

Full redesign: palette `border-[#ede9df]`, active `bg-[#ede8df]`, inactive `hover:bg-[#f7f5f1]`, `rounded-xl`; LogoMark + Reservo; `ROLE_STYLES`/`Avatar`/`NavItem`; nav: Overview+Explore always, My bookings if user, My services if Provider/Admin, Manage users/categories if Admin, Settings always, guest tip card; bottom card with logout; responsive sticky w-[280px] desktop + drawer+backdrop mobile; props `{open,onClose,scrollY}`.

### 3.7 Frontend — App Shell `client/src/App.tsx`

Imports Overview/Settings, `pageTitle` handles `/overview` & `/settings`, TopBar compact at `scrollY>8`, routes `/overview` + `/settings`, `showSidebar=!isAuth&&!isHome`.

### 3.8 Frontend — Overview Page `client/src/pages/Overview.tsx` (NEW)

`useAuth` guard, `useQuery GET /api/overview`, skeleton/error, layout `max-w-5xl`: header + Settings link, stats 4-col, provider 3-col, Upcoming+Recent cards, My services card.

### 3.9 Frontend — Settings Page `client/src/pages/Settings.tsx` (NEW)

Loads `GET /api/auth/me`; Profile `PUT /api/auth/profile` (syncs localStorage); Security `POST /api/auth/change-password`; Danger zone two-step confirm `POST /api/auth/deactivate` then `logout()+navigate('/login')`.

### 3.10 UserManagement + api/users

`api/users.ts` adds `toggleUserActive(id)=>PATCH /users/{id}/toggle-active` and extends UserResponse. `UserManagement.tsx` adds toggleMutation, Active/Inactive badge + Activate/Deactivate button per row.

---

## 4. Build & Run

```
dotnet build server/MyApp.Api/MyApp.Api.csproj
dotnet run --project server/MyApp.Api   # http://localhost:5294, api /api
npm --prefix client install
npm --prefix client run dev             # VITE_API_URL defaults to http://localhost:5294/api
```
DB auto-migrates via `Database.MigrateAsync()` in `Program.cs`.

## 5. Manual Test

1. Customer: /overview bookings only, /settings profile/pwd/deactivate.
2. Provider: create service/bookings → /overview shows services+rating.
3. Admin: /admin/users toggle active → blocked 401 on login then reactivate.
4. Danger zone: deactivate → redirected to /login, blocked until admin re-activates.

## 6. Notes

- `IsActive` default true so existing rows stay active; self-toggle blocked for admins, self-deactivation allowed.
- Sidebar compact via `scrollY` (56→48px). No new npm deps; warm beige palette.

## 7. Files Created / Modified

NEW: OverviewController.cs, MeResponse.cs, UpdateProfileRequest.cs, ChangePasswordRequest.cs, OverviewResponse.cs, 20261018193719_AddUserPhoneAndIsActive (+Designer), Overview.tsx, Settings.tsx, IMPLEMENTATION_GUIDE.md
EDIT: Entities/User.cs, AppDbContextModelSnapshot.cs, AuthController.cs, UsersController.cs, DTOs/UserResponse.cs, components/Sidebar.tsx, App.tsx, pages/UserManagement.tsx, api/users.ts

## 8. Next Steps

Email verification after profile change, paginate overview bookings, toasts/optimistic updates, tests (xUnit+Moq, Vitest).

| POST /api/auth/deactivate | Auth | NEW: IsActive=false for self |

### 3.4 OverviewController (NEW file)

GET /api/overview [Authorize]: loads User + Bookings (Include Element.Service), computes total/upcoming/completed/cancelled, recent=Take(5), upcomingBookings=Where(LowerBound>now && Confirmed).Take(5); if Provider/Admin also loads Services+Elements and avg rating from Reviews. Returns OverviewResponse.

### 3.5 UsersController

- GET /api/users projects PhoneNumber+IsActive.
- NEW PATCH /api/users/{id}/toggle-active [Admin]: flips IsActive, blocks self-toggle, returns UserResponse.
- PATCH role now returns PhoneNumber/IsActive too.

### 3.6 Sidebar (client/src/components/Sidebar.tsx)

Full redesign: palette border #ede9df, active bg #ede8df, inactive hover #f7f5f1, rounded-xl; LogoMark + Reservo; ROLE_STYLES; Avatar/ NavItem; SidebarInner nav: Overview+Explore always, My bookings if user, My services if Provider/Admin, Manage users/categories if Admin, Settings always, guest tip card; bottom user card with logout; responsive: desktop sticky w280 + mobile drawer with backdrop; props {open,onClose,scrollY}.

### 3.7 App Shell (client/src/App.tsx)

Imports Overview/Settings, pageTitle handles /overview & /settings, TopBar compact at scrollY>8, routes /overview and /settings, showSidebar=!isAuth&&!isHome.

### 3.8 Overview Page (client/src/pages/Overview.tsx NEW)

useAuth guard, useQuery GET /api/overview, skeleton/error states, layout max-w-5xl: header + Settings link, stats grid 4 cols, provider grid 3 cols, Upcoming+Recent cards, My services card.

### 3.9 Settings Page (client/src/pages/Settings.tsx NEW)

Loads GET /api/auth/me, Profile form PUT /api/auth/profile (syncs localStorage), Security form POST /api/auth/change-password, Danger zone two-step confirm POST /api/auth/deactivate then logout+nav /login.

### 3.10 UserManagement + api/users

Added toggleUserActive(id) => PATCH /users/{id}/toggle-active, toggleMutation, Active/Inactive badge + Activate/Deactivate button per row, invalidates allUsers; UserResponse extended with phoneNumber/isActive.

---

## 4. Build & Run

```
dotnet build server/MyApp.Api/MyApp.Api.csproj
dotnet run --project server/MyApp.Api  # http://localhost:5294, api /api
npm --prefix client install
npm --prefix client run dev  # VITE_API_URL defaults to http://localhost:5294/api
```
DB auto-migrates via Database.MigrateAsync() in Program.cs.

## 5. Manual Test

1. Customer: /overview (bookings only), /settings profile/pwd/deactivate.
2. Provider: create service/bookings, /overview shows services+rating.
3. Admin: /admin/users toggle active, verify blocked login 401 then reactivate.
4. Danger zone: deactivate then login blocked until admin re-activates.

## 6. Decisions & Notes

- IsActive default true so existing rows stay active.
- Admin self-toggle blocked; self-deactivation allowed (needs another admin/DB to recover) per spec.
- Sidebar compact via scrollY (56->48px).
- No new npm deps; warm beige palette matches mock.

## 7. Files Created / Modified

NEW: OverviewController.cs, MeResponse.cs, UpdateProfileRequest.cs, ChangePasswordRequest.cs, OverviewResponse.cs, 20261018193719_AddUserPhoneAndIsActive.cs+.Designer.cs, Overview.tsx, Settings.tsx, IMPLEMENTATION_GUIDE.md
EDIT: Entities/User.cs, AppDbContextModelSnapshot.cs, AuthController.cs, UsersController.cs, DTOs/UserResponse.cs, components/Sidebar.tsx, App.tsx, pages/UserManagement.tsx, api/users.ts

## 8. Next Steps

Email verify after profile email change, paginate overview bookings, toasts/optimistic updates, xUnit+Moq + Vitest tests.
