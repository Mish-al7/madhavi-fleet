# madhavi-fleet — Complete Changes Documentation

**Session Date:** June 18, 2026  
**Project:** `madhavi-fleet` (ActivFleet Fleet Management System)  
**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, MongoDB/Mongoose, NextAuth.js, Recharts

---

## Summary of Session Goals

This session covered a large set of improvements to the admin dashboard of the ActivFleet application, requested in sequence:

1. Reports page — include Nightly Services and Tour Trips data
2. App-wide mobile-first responsive layout using cards
3. Verify implementation coverage
4. Card layout for all pages (not just reports)
5. Dashboard cleanup — lighter, cleaner layout with theme/dark-mode toggle near notifications
6. Trip type filters, chart/graph responsiveness on mobile
7. Theme toggle placement fix — desktop vs. mobile
8. Sticky mobile header (fixed to top on scroll)
9. Vehicle name + nickname in all vehicle dropdowns
10. Replace text "Admin Portal / ActivFleet" header with the custom ActivFleet logo image

---

## Phase 1 — Reports: Nightly Services & Tour Trips Integration

### Files Modified
- `src/app/admin/reports/page.js`

### Changes
- Added **Nightly Services** and **Tour Trips** (`trip_type`) as filter options in the Reports page.
- Trip type dropdown/filter updated to allow selecting:
  - All Trips
  - Regular Trips
  - Nightly Services
  - Tour Trips
- Report data fetch and display logic updated to pass `trip_type` parameter to the API.

### API Files Modified
- `src/app/api/reports/profit-loss/route.js`
- `src/app/api/reports/trip-summary/route.js`
- `src/app/api/reports/vehicle-profitability/route.js`
- `src/app/api/reports/expense-breakdown/route.js`
- `src/app/api/reports/export/route.js`

Each API route was updated to:
- Accept a `trip_type` query parameter.
- Filter MongoDB queries using `trip_type` when provided.
- Support all combinations: no filter (all trips), `regular`, `nightly`, or `tour` (if separate Tour Trip model applies).

---

## Phase 2 — Mobile-First Responsive Layout (Card Views)

### Goal
Convert all HTML `<table>` layouts in the admin dashboard to a dual-rendering approach:
- **Desktop (md and above):** Standard table view (`hidden md:block overflow-x-auto`)
- **Mobile (below md):** Card-based list view (`md:hidden`)

### Files Modified & Changes Made

#### 1. Trip Sheets Page
**File:** `src/app/admin/trip-sheets/page.js`
- Wrapped the main trips table in `hidden md:block overflow-x-auto`.
- Added a `md:hidden` card list below it.
- Each card shows:
  - Trip sheet number & date
  - Customer name, vehicle type, driver name
  - Bill amount
  - Action buttons: Download PDF, View Details (always visible)

#### 2. Invoices Page
**File:** `src/app/admin/invoices/page.js`
- Wrapped main invoice table in `hidden md:block`.
- Added `md:hidden` card grid.
- Each card shows:
  - Invoice No & created date
  - Customer name, vehicle number, booking number
  - Total KM, total hours, final amount (with override badge if applicable)
  - Action buttons: Print/Download, Edit, Delete (always visible)

#### 3. Route Analytics Tab
**File:** `src/app/admin/routes/page.js`
- The Route Revenue & Trip Performance table (under `activeTab === 'analytics'`) wrapped in `hidden md:block overflow-x-auto`.
- Added `md:hidden` card list.
- Each card shows:
  - Route name / path and distance (KM)
  - From / To locations
  - Total trips count, average seats filled
  - Financial grid: Income, Expenses, Net Profit

#### 4. Personal Cash Ledger Page
**File:** `src/app/admin/personal-ledger/page.js`
- Wrapped ledger table in `hidden md:block overflow-x-auto`.
- Added `md:hidden` card list.
- Each card shows:
  - Date and type badge (Income / Expense — color-coded)
  - Description
  - Amount (color-coded: green for income, red for expense)
  - Running balance
  - Edit & Delete action buttons

#### 5. Vehicle Ledger Page
**File:** `src/app/admin/ledger/[vehicleId]/page.js`
- Wrapped the main ledger table in `hidden md:block overflow-x-auto`.
- Added `md:hidden` collapsible card list.
- Each card supports click-to-expand:
  - **Header (always visible):** Date, Route, Driver, Running Balance, expand/collapse chevron
  - **Expanded section:**
    - Trip Income and payment status (with inline Mark Paid interface)
    - Expense breakdown: Fuel, Toll/Fasttag, Driver Allowance, Service, Adblue, Grease, Air, Other
    - Notes
  - **Footer (always visible):** Edit & Delete buttons

#### 6. Vehicle Service Logs Tab
**File:** `src/app/admin/vehicles/[id]/_components/ServiceLogsTab.js`
- Wrapped service logs table in `hidden md:block overflow-x-auto`.
- Added `md:hidden` card list.
- Each card shows:
  - Service date and category badge
  - Odometer reading, provider name
  - Parts & Labour cost breakdown
  - Description / notes
  - Follow-up status with Toggle "Mark Done" button
  - Edit & Delete action buttons

#### 7. Dashboard — Vehicle Performance Table
**File:** `src/app/admin/summary/page.js`
- Wrapped the "Detailed Vehicle Performance" table in `hidden md:block overflow-x-auto`.
- Added `md:hidden` card list below it.
- Each card shows:
  - Vehicle registration number
  - Income, Expenses, Profit (color-coded)
  - Margin percentage
  - Clicking the card navigates to that vehicle's ledger page

---

## Phase 3 — Dashboard UI Cleanup (Mobile)

### Files Modified
- `src/app/admin/summary/page.js`
- `src/app/admin/layout.js`

### Changes

#### Monthly Date Filter — Horizontal Scroll on Mobile
- The monthly date filter tab list was restructured to scroll horizontally on mobile.
- Changed from wrapping multiple rows to a single `flex flex-nowrap overflow-x-auto` row.
- This frees up vertical space and keeps the month selector clean and compact.

#### Trip Type / Filter Dropdowns — Compact Display
- Trip type filter and other filter controls on the Dashboard were restructured to use `<select>` dropdowns (instead of expanded button rows).
- Reduces visual clutter on small mobile screens.

---

## Phase 4 — Theme Toggle (Dark/Light Mode Switch) Placement Fix

### Problem
The dark/light mode ThemeToggle switch had been placed in the sidebar header (desktop sidebar), causing layout shifts and inconsistency.

### Files Modified
- `src/app/admin/layout.js`
- `src/app/admin/summary/page.js`

### Changes

#### Mobile Header
- `ThemeToggle` placed next to the Notification Bell (`NotificationBell`) in the mobile sticky header.
- This gives users immediate access to toggle themes from the top bar on mobile.

#### Desktop (Sidebar Restored)
- `ThemeToggle` **removed** from the desktop sidebar header — restoring the original clean sidebar layout showing only the logo and notification bell.
- `ThemeToggle` **added** to the Dashboard (Summary) page header, placed next to the Segmented Control Tabs (Overview / Trip Type filter tabs).
- This keeps the toggle accessible but does not disrupt the sidebar on desktop.

---

## Phase 5 — Analytics Page: Chart/Graph Responsiveness

### File Modified
- `src/app/admin/analytics/page.js`

### Change
- Replaced hardcoded `min-w-[500px]` on chart card containers with `min-w-0 md:min-w-[500px]`.
- This allows all Recharts graphs (line, bar, pie) to scale down fluidly on mobile viewports.
- On desktop (`md` and above), charts retain their original fixed minimum width of 500px.

---

## Phase 6 — Sticky Mobile Header

### File Modified
- `src/app/admin/layout.js`

### Change
- Added `sticky top-0` and `backdrop-blur` to the mobile `<header>` element.
- Full className applied:
  ```
  sticky top-0 md:hidden flex items-center justify-between p-4
  bg-slate-900/95 backdrop-blur border-b border-slate-800 flex-shrink-0 z-20
  ```
- The mobile header (with ActivFleet logo, ThemeToggle, Notification Bell, and Hamburger menu) now remains **fixed at the top of the viewport** at all times as the user scrolls.

---

## Phase 7 — Vehicle Name & Nickname in Dropdowns

### Goal
Display vehicle's name (`vehicle_name`) and nickname (`nickname`) alongside the registration number (`vehicle_no`) in all vehicle selection dropdowns across the application.

### Format Applied
```
{vehicle_no} ({vehicle_name}) - {nickname}
```
(Conditional: only shows `vehicle_name` or `nickname` parts if those fields exist on the record)

### Files Modified

| File | Location |
|------|----------|
| `src/app/admin/bookings/BookingCreateModal.js` | Admin — Create Booking Modal |
| `src/app/admin/bookings/BookingEditModal.js` | Admin — Edit Booking Modal |
| `src/app/bookings/new/page.js` | Customer-facing — New Booking Page |
| `src/app/components/EditTripModal.js` | Tour Trips — Edit Trip Modal |
| `src/app/trips/new/page.js` | Driver — New Trip Page |
| `src/app/admin/nightly-service/page.js` | Admin — Nightly Service Form |
| `src/app/admin/trips/page.js` | Admin — Tour Trips Page |
| `src/app/admin/reports/page.js` | Admin — Reports Filter |
| `src/app/admin/expenses/page.js` | Admin — Expenses Filter |
| `src/components/admin/expenses/AddExpenseModal.js` | Admin — Add Expense Modal |

---

## Phase 8 — Logo Replacement (Admin Portal Header)

### Problem
The desktop sidebar and mobile header both displayed plain text: **"Admin Portal"** (heading) and **"ActivFleet"** (subtitle).

### Solution
Replaced text headings with the official ActivFleet logo image.

### Files Modified
- `public/logo.jpg` — **New file added** (user-provided ActivFleet logo image)
- `src/app/admin/layout.js` — Both mobile and desktop header updated

### Changes in `layout.js`

#### Mobile Header (before)
```jsx
<span className="text-lg font-bold text-white">Admin Portal</span>
<span className="text-xs text-slate-400">ActivFleet</span>
```

#### Mobile Header (after)
```jsx
<Link href="/admin/summary" className="flex items-center gap-2">
    <img
        src="/logo.jpg"
        alt="ActivFleet Logo"
        className="h-8 w-auto rounded-lg object-contain"
    />
</Link>
```

#### Desktop Sidebar Header (before)
```jsx
<h1 className="text-xl font-bold text-white">Admin Portal</h1>
<p className="text-xs text-slate-400">ActivFleet</p>
```

#### Desktop Sidebar Header (after)
```jsx
<Link href="/admin/summary" className="flex items-center">
    <img
        src="/logo.jpg"
        alt="ActivFleet Logo"
        className="h-10 w-auto rounded-lg object-contain"
    />
</Link>
<NotificationBell align="left" />
```

---

## Data Model Changes (Background — Earlier Sessions)

These model changes were already in place from prior work referenced in the conversation:

### `src/models/Trip.js`
- Added `trip_type` field: `enum: ['regular', 'nightly']`, default `'regular'`
- Added Nightly Service specific fields:
  - `route_id` (ref: Route)
  - `cleaner_name`, `cleaner_payment`
  - `driver_payment`
  - `seats_filled`
  - `toll`
  - `office_offline_collection`
  - `online_booking_collection`
- Updated `pre('validate')` hook to calculate `income` and `total_expenses` differently based on `trip_type`:
  - **Nightly:** `income = office_offline_collection + online_booking_collection`; expenses = fuel + toll + driver_payment + cleaner_payment + other_expense
  - **Regular:** original calculation preserved

### `src/models/Vehicle.js`
- Added new fields:
  - `vehicle_name` (String) — descriptive name
  - `seats` (Number) — seating capacity
  - `ac_type` (enum: 'AC' / 'Non-AC')
  - `bus_type` (enum: 'Tour Bus' / 'Service Bus')

### `src/models/Route.js` — **New Model**
- Fields: `name`, `from`, `to`, `distance_km`, `company_id`
- Compound unique index: `{ name: 1, company_id: 1 }` (route name unique per company)
- Associated APIs created under `src/app/api/routes/`

### Nightly Service APIs — **New**
- `src/app/api/nightly-services/route.js` — GET (list), POST (create)
- `src/app/api/nightly-services/[id]/route.js` — GET, PUT, DELETE

---

## Navigation (Sidebar) Updates

### File Modified
- `src/app/admin/layout.js`

### Changes
- Sidebar navigation reorganized into **grouped accordion sections**:
  - **Overview:** Summary, Daily Dashboard
  - **Operations:** Bookings, Tour Trips, Nightly Services, Trip Sheets, Invoices
  - **Fleet Management:** Vehicles, Drivers, Routes
  - **Financials:** Ledgers, Expenses, Opening Balances, Personal Ledger
  - **Insights & Config:** Reports, Analytics, Company Settings
- Each section collapses/expands with a chevron button.
- Active section auto-expands based on current pathname.
- `Nightly Services` and `Routes` pages added as new nav items.

---

## Build Verification

After all changes were applied, the production build was executed to confirm zero errors:

```bash
wsl bash -i -c "npm run build"
```

**Result:**
```
▲ Next.js 16.1.4
✓ Compiled successfully in 7.4s
✓ Generating static pages using 7 workers (71/71) in 587.6ms
```

✅ **Zero warnings. Zero errors. Build successful.**

---

## File Change Summary Table

| File | Change Type | Description |
|------|-------------|-------------|
| `public/logo.jpg` | NEW | ActivFleet brand logo image |
| `src/app/admin/layout.js` | MODIFIED | Logo, sticky header, ThemeToggle placement, accordion nav |
| `src/app/admin/summary/page.js` | MODIFIED | Card view for vehicle table, horizontal month filter, ThemeToggle on desktop |
| `src/app/admin/analytics/page.js` | MODIFIED | Chart container min-width responsive fix |
| `src/app/admin/trip-sheets/page.js` | MODIFIED | Card view on mobile |
| `src/app/admin/invoices/page.js` | MODIFIED | Card view on mobile |
| `src/app/admin/routes/page.js` | MODIFIED | Card view on mobile (analytics tab) |
| `src/app/admin/personal-ledger/page.js` | MODIFIED | Card view on mobile |
| `src/app/admin/ledger/[vehicleId]/page.js` | MODIFIED | Collapsible card view on mobile |
| `src/app/admin/vehicles/[id]/_components/ServiceLogsTab.js` | MODIFIED | Card view on mobile |
| `src/app/admin/nightly-service/page.js` | MODIFIED | Vehicle dropdown with name+nickname |
| `src/app/admin/trips/page.js` | MODIFIED | Vehicle dropdown with name+nickname |
| `src/app/admin/reports/page.js` | MODIFIED | Vehicle dropdown + trip_type filter |
| `src/app/admin/expenses/page.js` | MODIFIED | Vehicle dropdown with name+nickname |
| `src/app/admin/bookings/BookingCreateModal.js` | MODIFIED | Vehicle dropdown with name+nickname |
| `src/app/admin/bookings/BookingEditModal.js` | MODIFIED | Vehicle dropdown with name+nickname |
| `src/app/bookings/new/page.js` | MODIFIED | Vehicle dropdown with name+nickname |
| `src/app/trips/new/page.js` | MODIFIED | Vehicle dropdown with name+nickname |
| `src/app/components/EditTripModal.js` | MODIFIED | Vehicle dropdown with name+nickname |
| `src/components/admin/expenses/AddExpenseModal.js` | MODIFIED | Vehicle dropdown with name+nickname |
| `src/models/Trip.js` | MODIFIED | Nightly service fields + trip_type logic |
| `src/models/Vehicle.js` | MODIFIED | vehicle_name, seats, ac_type, bus_type |
| `src/models/Route.js` | NEW | Route model for nightly service routes |
| `src/app/api/routes/route.js` | NEW | Routes API (GET, POST) |
| `src/app/api/routes/[id]/route.js` | NEW | Route detail API (GET, PUT, DELETE) |
| `src/app/api/nightly-services/route.js` | NEW | Nightly service API (GET, POST) |
| `src/app/api/nightly-services/[id]/route.js` | NEW | Nightly service detail API (GET, PUT, DELETE) |
| `src/app/api/reports/profit-loss/route.js` | MODIFIED | trip_type filter support |
| `src/app/api/reports/trip-summary/route.js` | MODIFIED | trip_type filter support |
| `src/app/api/reports/vehicle-profitability/route.js` | MODIFIED | trip_type filter support |
| `src/app/api/reports/expense-breakdown/route.js` | MODIFIED | trip_type filter support |
| `src/app/api/reports/export/route.js` | MODIFIED | trip_type filter support |

---

*Documentation generated: June 18, 2026*  
*Project: madhavi-fleet (ActivFleet) — Next.js Fleet Management System*
