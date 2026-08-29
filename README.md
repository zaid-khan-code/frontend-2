# EMS UI — HR Module (frontend-2)

A React + Vite TypeScript frontend for the EMS ERP HR module. This README lists the actual features implemented in this repository (extracted from the app routes and page modules). The list contains only features that exist in the codebase (src/pages and the route configuration).

## Quick summary
- Stack: TypeScript, React, Vite
- Key libraries: React Router, @tanstack/react-query, react-hook-form, zod, tailwindcss
- Purpose: HR-facing UI for employee management, attendance, leave, penalties, announcements, reporting, and admin configuration.

## How this README was created
This file was generated from the repository's route configuration and page modules (src/App.tsx and files in src/pages). Only pages and settings that exist in the code are included below.

---

## Features (by module)

### Authentication & Access
- Login page
- Change password workflow
- Unauthorized page
- Role-based protected routes and permission checks (routes determine available pages per role)

### Admin & HR (Main layout)
- Launchpad (Super Admin)
- Dashboard (HR / Admin overview)
- Directory (both view and management entry point)
- Employees
  - Employees list / search / filters
  - Add employee (Employee wizard)
  - Employee detail page
  - Employee bulk upload
- Attendance
  - Attendance listing / overview
  - Attendance verification pages (branch/head-office review flows)
  - Duty roster management (duty-roster)
  - Attendance report page
- Leave
  - Leave management listing and actions
  - Leave capacity (admin view)
  - Leave wallet history
- Payroll
  - Payroll page (UI present; backend payroll remains Coming Soon in product rules)
- Promotions management
- Penalties
  - Penalty ledger (ledger view)
  - Penalty workflow (approve/reject workflow)
- Announcements
  - Announcements feed (company-level)
  - Announcement management/settings (create/update where permissions allow)
- Calendar
  - Calendar view
  - Calendar events settings (management where permitted)
- Accounts (Super Admin / Head HR)
- Audit Log (Super Admin-only, read-only view)
- Branch HR Dashboard (branch-specific HR overview)
- Head Office HR (head-of-office review pages)
- Reports & Saved Reports
  - Overview page
  - Saved reports management / viewing
  - Attendance report (final report & exports)

### Settings / Configuration (admin-protected)
- Departments
- Designations
- Work modes
- Work locations
- Employment types
- Job statuses
- Shifts
- Leave types
- Leave policies
- Leave capacity settings
- Allowance types
- Penalty rules
- Roles
- Directory management (settings/directory)
- Calendar events settings
- Announcements settings

### Employee Self-Service (Employee layout)
- My Dashboard
- My Attendance
- My Payslips (UI present; treated as feature placeholder in some routes)
- My Leave
- My Penalties
- My Profile
- My Calendar
- My Announcements
- My Directory
- My Widgets (feature placeholder)
- My Leave Wallet (feature placeholder)

### UI & Platform Infrastructure
- MainLayout and EmployeeLayout (layout components)
- ErrorBoundary
- Toast provider (notifications)
- React Query integration for data fetching and caching
- Context providers: Auth, Data, EmployeeWizard, Toast
- Form validation using react-hook-form + zod (present in pages)
- Feature placeholders used where backend feature is incomplete (e.g., some employee widgets, payslips)

---

## Files / Places to look
- Route & feature mapping: src/App.tsx
- Pages: src/pages/*.tsx (each file corresponds to a feature/module listed above)
- Settings pages grouped: src/pages/settings/*
- Providers and state: src/context/* and src/store/*
- Styles: src/styles/* and tailwind.config.ts
- Scripts: see package.json for dev/build/test commands

## How to run (local development)
From repository root:
```bash
# install dependencies
npm install

# start dev server
npm run dev

# run tests
npm run test

# build production bundle
npm run build
```

## Notes & constraints
- The README lists only features that appear in the repository code (routes & pages). It does not include planned or external features not present in src/.
- Payroll and several employee self-service items are present in the UI but may still be treated as placeholders depending on backend readiness.
- Audit Log is present as a Super Admin read-only page in the UI; backend behavior and access rules must be followed per product rules.

## Contact / repo
Repository: https://github.com/zaid-khan-code/frontend-2
Homepage: https://esspl-erp.vercel.app



---

> Link provided by user: https://github.com/zaid-khan-code/frontend-2#authentication--access
