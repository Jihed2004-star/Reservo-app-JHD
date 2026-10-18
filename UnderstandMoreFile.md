# Guest-to-Element Login Redirection & Time Selection Retention

## 1. Overview & Objective

When an unauthenticated guest browses Reservo and finds an element they want to book, they shouldn't lose their context or have to search for that element again after logging in.

### The Desired User Experience:
1. A guest browses to an Element details page (`/elements/:id`).
2. The guest can view provider availability and **select their desired time slot directly on the calendar**.
3. When the guest clicks **"Log in to book"**, they are taken to the Login screen (or Sign up).
4. After successful authentication, they are **immediately redirected back to that exact Element**.
5. The time slot they selected earlier is **pre-selected and restored**, allowing them to hit **"Book"** in one click.

---

## 2. Technical Architecture & How It Was Done

The implementation links three key layers: **Interactive Selection**, **Route State Forwarding**, and **Post-Auth Redirection**.

```
[Guest on /elements/:id]
      │
      ├─► Selects slot on FullCalendar ──► Saved to sessionStorage ('pending_booking')
      │
      └─► Clicks "Log in to book" ──► Redirects to /login?redirect=/elements/:id (with location.state)
                                              │
                                              ▼
                                     [Login / Register]
                                              │
                                              ├─► Successful Auth (JWT stored)
                                              │
                                              └─► navigate(redirectTarget, { replace: true })
                                                         │
                                                         ▼
                                            [/elements/:id as Authenticated User]
                                                         │
                                                         └─► Slot restored from sessionStorage
                                                         └─► One-click "Book" ready
```

---

### Step-by-Step Implementation

### Step 1: Enabling Guest Selection on `ElementDetail.tsx`
- **Previously**: FullCalendar had `selectable={!!user}`, disabling calendar drag/select for unauthenticated guests.
- **Update**: Changed to `selectable={true}`.
- **Persistence**: When `handleSelect(info)` fires:
  - `startTime` and `endTime` are stored in React component state.
  - The selection is synchronized to `sessionStorage` under the key `pending_booking`:
    ```ts
    sessionStorage.setItem(
      'pending_booking',
      JSON.stringify({
        elementId: id,
        startTime: start,
        endTime: end,
      })
    );
    ```
- **Automatic Restoration**: When `ElementDetail` mounts (`useEffect`), it checks `sessionStorage`. If a matching `elementId` is found, the start and end times are populated automatically into state.

---

### Step 2: Passing the Target URL to Auth Pages
In `ElementDetail.tsx`, the guest booking prompt renders a login link with dual-layer redirection parameters:
1. **URL Query Parameter**: `?redirect=${encodeURIComponent(location.pathname)}` (clean and bookmarkable).
2. **React Router Location State**: `state={{ from: location.pathname }}` (in-memory routing history).

```tsx
<Link
  to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
  state={{ from: location.pathname }}
  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
>
  Log in to book
</Link>
```

---

### Step 3: Handling Redirection in `Login.tsx` & `Register.tsx`
In both `Login.tsx` and `Register.tsx`:
1. We read the target from either `location.state?.from` or `searchParams.get('redirect')`:
   ```ts
   const redirectTarget = (location.state as any)?.from || searchParams.get('redirect') || '/';
   ```
2. After successful authentication (`loginApi` succeeds and token is saved in `AuthContext`):
   ```ts
   login(response);
   navigate(redirectTarget, { replace: true });
   ```
3. **Seamless Login ↔ Register switching**:
   If a user visits Login but decides to click **"Sign up"** (or vice versa), the `redirectTarget` is preserved and forwarded:
   ```tsx
   <Link
     to={redirectTarget !== '/' ? `/register?redirect=${encodeURIComponent(redirectTarget)}` : '/register'}
     state={{ from: redirectTarget }}
   >
     Sign up
   </Link>
   ```

---

### Step 4: Final Booking Cleanup
Once the authenticated user submits the booking in `ElementDetail.tsx`:
- `bookingMutation` confirms the reservation.
- `sessionStorage.removeItem('pending_booking')` purges the temporary slot data so future sessions start clean.

---

## 3. Technologies & Web APIs Used

| Technology | Purpose in this Feature |
|---|---|
| **React Router (v7)** | `useNavigate`, `useLocation`, and `useSearchParams` for capturing return paths and performing post-login navigation. |
| **Web Storage API (`sessionStorage`)** | Preserves selected booking slots across page unmounts without polluting permanent `localStorage` or backend databases. |
| **FullCalendar React (`@fullcalendar/react`)** | Calendar rendering and interactive slot selection (`selectable={true}`, `interactionPlugin`). |
| **TanStack React Query (v5)** | Manages async booking mutation, server state cache, and automatic availability invalidation. |
| **React Context (`AuthContext`)** | Global authentication state managing JWT tokens and user session data. |
| **TypeScript** | Type-safe route params, date strings, and event handlers. |
| **Tailwind CSS (v4)** | Interactive UI styling for calendar slot highlights, action buttons, and responsive feedback cards. |
