remove the logo and keep only Reservo

- make the title in the header and not in the side bar

- make the guest only has access to home page and explore remove overview and settings for the guest

- in each category add the sum of avg of starts , and the min and max of the prices

- the footer only exist in home

- in manage pages , make their contents as a table ( table of users , services , elements .... )



[ -  the logo i want it in the space between side bar and header ( in top left ) 

- in the side bar add between each categories of option ( like the managment options add line and in the line there is managment text )  ]

## Changes Made

**1. Logo moved to the top-left corner between sidebar content and header**
- `Sidebar.tsx`: Imports `LogoMark` from `./ui/LogoMark` and renders it at the very top of the sidebar (`<LogoMark className="h-7 w-7" />` + "Reservo" wordmark), so it sits between the page content above and the nav links below. The header (`App.tsx`) keeps the "Reservo" text-only title link, so the logo now appears in both the header and the sidebar top-left.

**2. Separator lines with group labels added between nav categories**
- New `Separator` helper component in `Sidebar.tsx` — a horizontal line with a small uppercase label in gold (`#8a7f6f`, tracking-widest).
- Group labels placed between option clusters:
  - **Overview** → Home / Explore
  - **Account** → Overview, Settings
  - **My services** → My bookings / My services
  - **Management** → Manage users / Manage categories
  - **Account** → Settings

The separator line spans both sides of the label using `flex-1` border divs, matching the existing palette (`border-[#ede9df]`).

## Navigation summary (as enforced earlier)
- **Guest**: only Home + Explore + sign-in tip card (Overview, My bookings, My services, Management, Settings all `user &&` gated)
- **Provider**: Overview, My bookings, My services
- **Admin**: everything + Manage users / Manage categories

[
  - i dont want empty Separator lines for some logginers
- every logginer has his Separator lines with his options 
- remove logo from side bar
]

-------------------------------- images System --------------------------

Backend Database & Storage:

IFileStorageService + LocalFileStorageService (saves to disk, validates file types/sizes, generates unique GUID filenames, deletes old files).
Add ImageUrl to Category and Service.
Add new ElementImage entity (Id, ElementId, Url, IsPrimary, DisplayOrder, CreatedAt).
EF Core Migration.
Configure app.UseStaticFiles() so URLs like http://localhost:5294/uploads/elements/abc.webp serve the images.
Backend API Endpoints:

Updates to Category & Service controllers to accept an image.
CreateElement endpoint updated to accept List<IFormFile> alongside element data.
Element image management endpoints:
POST /api/elements/{id}/images (add more images)
DELETE /api/elements/{id}/images/{imageId} (delete an image)
PATCH /api/elements/{id}/images/{imageId}/primary (set primary cover)
Frontend (React):

Reusable ImageUploader component with preview and dropzone.
Integrate photo selection into ManageService.tsx (when creating a new element).
Integrate full photo gallery manager into ManageElement.tsx (upload new, delete, set cover).
Update CategoryManagement.tsx and Service edit forms for their single image.
Update cards and detail pages to display the real uploaded images instead of placeholders.

                         #########################        
All work is complete and verified. Here's the final state of the image-upload feature:

## Backend (unchanged this round, re-verified)
- `dotnet build` → **0 warnings, 0 errors**
- `upload_smoke.py` → **28/28 checks pass** (cover create/replace/old-file-404 → element gallery → append → set primary → delete/promote → invalid file 400 → cascade cleanup)
- `json_smoke.py` → **6/6 pass** (JSON fallbacks still 201/200/204/204)
- New `cover_remove_smoke.py` → **12/12 pass** — exercises the *exact* multipart payload the React forms send, including `RemoveImage=true`, and asserts the old file is deleted after the clear is persisted (category **and** service).

## Frontend wiring finished

| File | Change |
|---|---|
| `pages/CategoryManagement.tsx` | `image`/`removeImage` state, `ImageUploader` in create+edit form (shows `editingCategory.imageUrl`), reset on success, thumbnail column via `categoryImage()` |
| `pages/CreateService.tsx` | `image` state + `ImageUploader`, passed to `createService` |
| `pages/ManageService.tsx` | "Cover image" card with `ImageUploader` + `Save cover` (`coverMutation` → `updateService`, invalidates `service`/`services`); `MultiImageUploader` in the create-element form (`images: elementImages`); element thumbnails via `elementImage()` |
| `pages/ManageElement.tsx` | `ImageGalleryEditor` wired to `uploadElementImages`/`deleteElementImage`/`setPrimaryElementImage`; shared `galleryBusy`, `galleryError`, `refreshElement()` (invalidates `element` + parent `service`) |
| `pages/ElementDetail.tsx` | Hero uses `elementImage()`; "Images" panel now renders the real uploaded gallery (falls back to curated trio when empty) |
| `pages/Home.tsx`, `Services.tsx`, `ServiceDetail.tsx` | `categoryImage()` / `serviceImage()`; `Services` now resolves the category from the cached `['categories']` query so the hero banner shows the uploaded cover (keeps the name-based fallback until it loads) |
| `components/cards/*.tsx` | `categoryImage()` / `serviceImage()` / `elementImage()` |

## Verification
- `tsc -b --force` → exit 0
- `oxlint` → **0 errors**, 2 pre-existing warnings (`AuthContext.tsx`, `Badge.tsx` fast-refresh only)
- `npm run build` → built in 4.82s (only the pre-existing >500 kB chunk notice)
- No duplicate `galleryBusy` remains (the accidental copies from the last edit were collapsed to one, placed *after* the three mutations so there's no TDZ reference)

## Left for you (deliberate, not done)
1. **Manual browser pass** — hot-path logic is covered by the HTTP smoke tests, but I can't click through the UI headlessly. Suggested: create a category with a cover, replace it, remove it; upload a service cover from `ManageService`; add photos on element create, then set/delete/promote from the element page.
2. **Git index hygiene** — `.gitignore` already contains `**/bin/` and `**/obj/`, but 465 build artefacts are still *tracked* from before that rule. To untrack them (big staged deletion, do it as its own commit):
   ```bash
   git rm -r --cached server/MyApp.Api/bin server/MyApp.Api/obj server/MyApp.Data/bin server/MyApp.Data/obj
   ```
3. Commit this feature separately from the in-progress `ElementDetail`/calendar and `Overview`/`Settings` work that is also sitting in the working tree.


------------------------------------ REvenue Page ---------------------------

**Task: Build Provider Revenue & Detailed Sales Analytics Dashboard**

**Project Stack:**
- Backend: ASP.NET Core 10 + Entity Framework Core + PostgreSQL (`server/MyApp.Api`)
- Frontend: React + Vite + TypeScript + Tailwind CSS + TanStack Query (`client/src`)
- Design System: Modern SaaS with slate backgrounds (`#f8fafc`), clean border cards (`border-slate-200 bg-white rounded-2xl`), badge pills, and SVG data charts.

---

### 1. BACKEND REQUIREMENTS

Create a new controller `ProviderRevenueController.cs` (or add to an existing controller) with endpoint:
`GET /api/provider/revenue`
- Accessible only by authorized users in roles: `Provider`, `Admin`.
- Retrieves all services and elements owned by the current provider (`UserId`), then aggregates all their bookings.

#### Calculations:
1. **Financial KPIs**:
   - `TotalEarned`: Sum of `(Price × DurationUnits)` for all `Completed` bookings.
   - `UpcomingRevenue`: Sum of `(Price × DurationUnits)` for all `Confirmed` future bookings.
   - `ThisMonthRevenue`: Completed revenue within the current calendar month.
   - `LastMonthRevenue`: Completed revenue within the previous calendar month.
   - `MonthOverMonthGrowth`: Percentage change between this month and last month.
   - `AverageBookingValue`: `TotalEarned / CompletedCount`.
   - `CancelledRevenue`: Value of bookings that were `Cancelled`.

   *Note for duration calculation:*
   - If `BookingUnit == Hourly`: `Units = Math.Round((EndTime - StartTime).TotalHours, 1)`
   - If `BookingUnit == Daily`: `Units = Math.Max(1, Math.Round((EndTime - StartTime).TotalDays))`
   - If `BookingUnit == Monthly`: `Units = Math.Max(1, (EndTime.Year - StartTime.Year) * 12 + EndTime.Month - StartTime.Month)`
   - `TotalAmount = Units * Element.Price`

2. **Time Series Chart Data**:
   - Return daily revenue data for the last 30 days (`{ date: "YYYY-MM-DD", revenue: decimal, bookingsCount: int }`).
   - Return monthly revenue data for the last 12 months (`{ month: "MMM YYYY", revenue: decimal, bookingsCount: int }`).

3. **Breakdown by Element**:
   - List of all provider's elements sorted by highest revenue:
     `{ elementId, elementName, serviceName, bookingUnit, unitPrice, completedBookingsCount, totalUnitsSold, totalRevenue, percentageOfTotal }`

4. **Detailed Sales Ledger (Transactions)**:
   - Paginated or list of the latest 50 bookings:
     `{ id, bookingCode, customerName, serviceName, elementName, startTime, endTime, durationFormatted, unitPrice, totalAmount, status, createdAt }`

---

### 2. FRONTEND REQUIREMENTS

1. **New Page: `client/src/pages/ProviderRevenue.tsx`**:
   - **Header**: "Revenue & Sales Analytics" with a brief subtitle and "Export CSV" button.
   - **KPI Cards (5 across / responsive grid)**:
     - Total Net Earned
     - Pipeline / Upcoming Revenue
     - This Month (with green/red +/- % growth badge)
     - Average Order Value
     - Lost to Cancellations
   - **Revenue Over Time Chart Card**:
     - Toggle buttons: `7 Days` · `30 Days` · `12 Months`.
     - Clean SVG line/bar chart showing earnings progression with smooth tooltips/hover dots.
   - **Element Performance Breakdown**:
     - Table / progress bar list showing each element's revenue contribution and percentage bar.
   - **Detailed Sales Ledger Table**:
     - Columns: `Date`, `Customer`, `Service & Element`, `Duration`, `Amount`, `Status`.
     - Filter tabs: `All` · `Completed` · `Upcoming` · `Cancelled`.
     - Search input by customer or element name.
     - "Export to CSV" functionality to download the table directly in the browser.

2. **Navigation & Routing**:
   - Register route `/provider/revenue` in `client/src/App.tsx`.
   - Add "Revenue" link to `Sidebar.tsx` under the Provider navigation section with a currency/chart icon (`$`).
   - In `/provider/dashboard` and `/overview`, add a button/card linking to `/provider/revenue`.

---

### 3. VERIFICATION
- Run `dotnet build` to ensure backend compiles with zero errors.
- Run `npm run build` in `client` to ensure TypeScript and Vite build cleanly.
- Verify role restrictions: Providers only see their own revenue, Customers cannot access the page.
