# Fleet Ledger & Booking Web App
## System Specification – Next.js + MongoDB
Version: 1.0 (LOCKED)

This document defines the FINAL business logic and technical structure.
Cursor or any AI agent MUST NOT deviate without explicit instruction.

---

## 1. TECH STACK (NON-NEGOTIABLE)

- Framework: Next.js (App Router)
- Database: MongoDB
- ODM: Mongoose
- Auth: NextAuth
- Styling: Tailwind CSS
- Charts: Recharts or Chart.js

---

## 2. USER ROLES

### Admin
Full system access.

Admin CAN:
- Manage vehicles, drivers
- Assign vehicles to drivers
- Manage opening balances
- View all trips
- View ledgers
- View summaries
- View dashboard
- Import/export data

Admin CANNOT:
- Manually edit calculated balances

---

### Driver
Restricted access.

Driver CAN:
- Add trips
- Edit own trips
- View own trip history

Driver CANNOT:
- View balances
- View summaries
- View dashboards
- View other drivers’ data
- Edit opening balances
- Manually set month or totals

---

## 3. DATABASE SCHEMAS (MONGODB)

### Vehicle
{
_id,
vehicle_no: String (unique),
status: "active" | "inactive"
}

yaml
Copy code

---

### Driver (User)
{
_id,
name,
email,
role: "admin" | "driver",
assignedVehicles: [vehicle_id]
}

yaml
Copy code

---

### Trip
{
_id,
trip_date: Date,
month: String (YYYY-MM, auto-derived),
vehicle_id,
driver_id,
trip_route,

income: Number,

fuel: Number,
fasttag: Number,
driver_allowance: Number,
service: Number,
other_expense: Number,

total_expenses: Number (auto-calculated),
notes
}

yaml
Copy code

---

### OpeningBalance
{
_id,
vehicle_id (unique),
opening_balance: Number
}

yaml
Copy code

---

## 4. CALCULATION RULES (ABSOLUTE)

### Month
- Derived from `trip_date`
- Format: YYYY-MM
- Never user-editable

---

### Total Expenses
total_expenses =
fuel +
fasttag +
driver_allowance +
service +
other_expense

yaml
Copy code

---

### Running Balance (Computed Only)
For each vehicle, ordered by trip_date ASC:

running_balance =
opening_balance

cumulative_income

cumulative_expenses

yaml
Copy code

Rules:
- Never stored in DB
- Calculated in query/service layer
- Negative balances highlighted in UI

---

### Monthly Summary
Grouped by:
- month
- vehicle_id

Computed:
total_income = SUM(income)
total_expenses = SUM(total_expenses)
profit_loss = total_income - total_expenses

yaml
Copy code

---

## 5. API STRUCTURE (NEXT.JS)

- POST /api/trips → create trip
- GET /api/trips → role-based fetch
- GET /api/ledger/[vehicleId]
- GET /api/summary/monthly
- CRUD /api/vehicles
- CRUD /api/opening-balances
- POST /api/import

All routes MUST enforce role permissions.

---

## 6. SCREENS

### Driver Trip Entry
- Mobile-first
- Assigned vehicles only
- Auto-calculated fields locked
- No balances shown

---

### Vehicle Ledger (Admin)
Columns:
- Trip Date
- Month
- Route
- Driver
- Income
- Total Expenses
- Running Balance

Sorted by Trip Date ASC

---

### Monthly Summary (Admin)
Grouped by:
- Month
- Vehicle

Export:
- CSV
- Excel

---

### Dashboard (Admin)
Filter:
- Month selector

KPIs:
- Total Income
- Total Expenses
- Total Profit

Charts:
1. Profit per vehicle
2. Income vs expenses per vehicle
3. Monthly profit trend

Click vehicle → open ledger

---

## 7. OPENING BALANCE RULES

- One per vehicle
- Admin only
- Affects future balances only
- Historical trips unchanged

---

## 8. DATA IMPORT

- Upload Excel / Google Sheets
- Validate:
  - trip_date
  - vehicle existence
- Recalculate month
- Preview mandatory before save

---

## 9. OPTIONAL BOOKING MODULE (PHASE 2)

- Prevent overlapping bookings per vehicle
- Admin approval for swaps
- Calendar view

---

## 10. HARD CONSTRAINTS

- No manual balance editing
- No stored running balances
- No permission bypass
- No feature outside this spec

## 11 Actual Driver Name (Add-on Field)

Trips may include an optional field `actual_driver_name`.

Purpose:
- Represents the person who physically drove the vehicle
- Independent of system login or permissions

Rules:
- Free text
- Not a foreign key
- Not used for authorization
- Displayed in ledgers and summaries as the driver name
- If empty, fallback to logged-in driver name


---

END OF DOCUMENT