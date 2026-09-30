# Camtrack — Frontend

> GPS tracker stock & installation management — React web client.

The backend lives in a **separate repository** (`GPS_TRACKER_Back`). This app talks to it over REST and never touches the database directly.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Screens & Features](#screens--features)
   - [Authentication — Login & Register](#authentication--login--register)
   - [Dashboard (Stock Manager)](#dashboard-stock-manager)
   - [Trackers (Stock Manager)](#trackers-stock-manager)
   - [Clients (Stock Manager)](#clients-stock-manager)
   - [Vehicles (Stock Manager)](#vehicles-stock-manager)
   - [Interventions (Stock Manager)](#interventions-stock-manager)
   - [My Interventions (Technician)](#my-interventions-technician)
5. [Role-Based Routing](#role-based-routing)
6. [API Layer](#api-layer)
7. [Auth Context](#auth-context)
8. [UX Patterns](#ux-patterns)
9. [Environment Variables](#environment-variables)
10. [Getting Started](#getting-started)
11. [Test Accounts](#test-accounts)
12. [What Is Done / Not Done](#what-is-done--not-done)
13. [Possible Improvements](#possible-improvements)

---

## Overview

Camtrack is a management tool for a company that keeps GPS trackers in stock and sends technicians to install them in clients' vehicles. This frontend exposes two distinct user experiences based on role:

- **Stock Manager** — full control over trackers, clients, vehicles, and interventions, plus a rich analytics dashboard.
- **Technician** — a focused mobile-friendly view of their own assigned interventions with a one-tap completion flow.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 5 |
| UI library | Mantine v9 (components, forms, modals, notifications) |
| Routing | React Router v7 |
| HTTP client | Axios (single instance with interceptors) |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Tabler Icons |
| Styling | Tailwind CSS v4 (utility classes), Mantine theme (dark mode) |
| Linting | OxLint |

---

## Project Structure

```
src/
├── api/               # One file per backend resource, typed responses
│   ├── auth.ts
│   ├── axios.ts       # Shared axios instance + interceptors
│   ├── clients.ts
│   ├── dashboard.ts
│   ├── interventions.ts
│   ├── trackers.ts
│   └── vehicles.ts
├── components/
│   ├── AppLayout.tsx          # Sidebar + header shell
│   ├── ProtectedRoute.tsx     # Auth + role guard
│   ├── StatusBadge.tsx        # Colored badge for tracker/intervention status
│   ├── auth/
│   │   └── AuthShell.tsx      # Shared wrapper for login/register pages
│   ├── clients/
│   │   └── ClientFormModal.tsx
│   ├── interventions/
│   │   ├── CompleteInterventionModal.tsx
│   │   └── InterventionFormModal.tsx
│   ├── trackers/
│   │   ├── ChangeStatusModal.tsx
│   │   ├── HistoryDrawer.tsx
│   │   └── TrackerFormModal.tsx
│   ├── ui/                    # Radix-based primitives (button, input, label, card)
│   └── vehicles/
│       └── VehicleFormModal.tsx
├── context/
│   └── AuthContext.tsx        # JWT + user state, login/register/logout
├── hooks/
│   └── useDebouncedValue.ts
├── lib/
│   ├── apiError.ts            # Extract server error messages consistently
│   ├── trackers.ts            # Status labels + allowed transition map
│   └── utils.ts
├── pages/
│   ├── Dashboard.tsx
│   ├── Clients.tsx
│   ├── Interventions.tsx
│   ├── Login.tsx
│   ├── MyInterventions.tsx
│   ├── Register.tsx
│   ├── Trackers.tsx
│   └── Vehicles.tsx
├── types/
│   └── index.ts               # All shared TypeScript interfaces and enums
├── App.tsx                    # Router + providers
└── main.tsx
```

---

## Screens & Features

### Authentication — Login & Register

Both pages share a polished `AuthShell` wrapper with a branded header, card layout, and animated entry (Framer Motion fade-in/slide-up).

**Login flow (two-step OTP)**

1. User enters username or email + password.
2. On success the backend sends a 6-digit OTP to the registered email and returns the email address.
3. A second step appears asking for the OTP.
4. On valid OTP the backend issues the JWT; the app stores it and redirects to the appropriate home screen based on role (`/dashboard` for managers, `/my-interventions` for technicians).

In non-production environments the backend echoes the OTP in the response. The UI displays it in a dev-mode panel with a **"Use this code"** button so developers can log in without a real email server.

**Register flow (two-step OTP)**

1. User fills username, full name, email, password, and selects a role (TECHNICIAN or STOCK_MANAGER).
2. On submit the backend creates the unverified account and sends a verification OTP.
3. Same OTP step as login; on success the account is verified and the JWT is issued.
4. If the email already exists but the account is unverified, the backend re-sends the OTP instead of returning a conflict error.

Both pages include:
- Inline field-level validation (client-side before the API call)
- Server error messages surfaced in Mantine notifications and next to the relevant field
- Loading states on all buttons

---

### Dashboard (Stock Manager)

`/dashboard` — accessible to `STOCK_MANAGER` only.

**Tracker KPI cards** — four cards, one per status (`IN_STOCK`, `INSTALLED`, `FAULTY`, `RETURNED`), each showing the count, a coloured progress bar representing the share of the total fleet, and a matching icon.

**Low-stock alert** — a full-width red alert banner appears when `lowStockAlert === true`, clearly showing the current in-stock count versus the configured threshold.

**Tracker status breakdown chart** — a `RingProgress` donut chart (Mantine) summarising all statuses with a legend. Shows "No tracker data yet" when the fleet is empty.

**Interventions this week bar chart** — a Recharts `BarChart` showing the number of interventions per technician for the current calendar week (Monday–Sunday). Each bar is a different colour. Shows an empty state with an icon when there are no interventions for the week.

**Technician summary table** — a striped Mantine table listing each technician with their weekly count and a relative activity progress bar. Supports scroll on small screens.

All data is fetched from `GET /dashboard` on mount. Loading state shows a centred dots loader; error state shows an alert.

---

### Trackers (Stock Manager)

`/trackers` — accessible to `STOCK_MANAGER` only.

**Paginated table** — 10 rows per page, columns: IMEI (monospace), model, SIM number (monospace), status badge, linked vehicle plate, date added, action buttons.

**Filters:**
- Text search by IMEI with 350 ms debounce.
- Status dropdown filter.
- Both filters reset the page to 1 automatically.

**Actions per row:**
- **Change status** (arrow-switch icon) — opens `ChangeStatusModal`. The button is disabled and shows a tooltip explaining why when no manual transition is available for the current status. The allowed transitions are:
  - `IN_STOCK` → `FAULTY`
  - `INSTALLED` → `RETURNED` or `FAULTY`
  - `FAULTY` → `RETURNED`
  - `RETURNED` → `IN_STOCK`
  - `IN_STOCK` → `INSTALLED` is never offered manually; it only happens via an intervention completion.
  An optional comment field is available in the modal.
- **Edit** (pencil icon) — opens `TrackerFormModal` in edit mode. Only model and SIM number are editable; IMEI is read-only after creation.
- **History** (clock icon) — opens `HistoryDrawer` showing all `TrackerHistory` entries for the tracker: date, user, old status → new status, action name, and optional comment.

**Create tracker** — "Receive tracker" button opens `TrackerFormModal` in create mode (IMEI, model, SIM number).

**Empty state** — shows an icon with a prompt to create the first tracker when the list is empty.

**Refresh button** — reloads the current page without changing filters.

---

### Clients (Stock Manager)

`/clients` — accessible to `STOCK_MANAGER` only.

**Searchable list** — text search by name or phone with 350 ms debounce. Client-side pagination (10 per page) applied to the full list returned by the API.

**Table columns:** name, phone (monospace), address, vehicle count, actions.

**Create / Edit** — `ClientFormModal` with name, phone, and address fields. The same modal handles both create and update.

**Delete** — guarded by a Mantine confirm modal. The delete button is disabled and shows a tooltip ("Delete the vehicles first") when the client has linked vehicles. If the API returns a 409, the error message from the server is shown in a notification.

---

### Vehicles (Stock Manager)

`/vehicles` — accessible to `STOCK_MANAGER` only.

**Filtered list:**
- Text search across plate, brand, model, and client name (client-side, debounced 350 ms).
- Client filter dropdown (populated from `GET /clients`).

**Table columns:** plate (monospace), brand, model, client name, linked tracker count, actions.

**Create / Edit** — `VehicleFormModal` with plate, brand, model, and a searchable client select. A yellow alert is shown if no clients exist yet, since every vehicle requires a client.

**Delete** — confirm modal, disabled when the vehicle has linked trackers (tooltip: "Detach the tracker first"). 409 errors from the API are surfaced in a notification.

---

### Interventions (Stock Manager)

`/interventions` — accessible to `STOCK_MANAGER` only.

**Filtered list:**
- Status filter (PLANNED / DONE / CANCELLED).
- Technician filter (populated from `GET /users?role=TECHNICIAN`).

**Table columns:** client, vehicle plate + brand/model (sub-row), technician, scheduled date/time + completed date, status badge, cancel action.

**Plan intervention** — `InterventionFormModal` with:
- Client select (populates the vehicle dropdown to only show vehicles for that client).
- Technician select (only users with `TECHNICIAN` role).
- Date/time picker.
- Address field.

**Cancel** — confirm modal, only shown for `PLANNED` interventions. Sets status to `CANCELLED`.

Status badge colours: blue (PLANNED), teal (DONE), gray (CANCELLED).

---

### My Interventions (Technician)

`/my-interventions` — accessible to `TECHNICIAN` only. Mobile-friendly card layout, max width 600 px centred.

**Sorted list** — PLANNED interventions appear first, sorted by scheduled date ascending. DONE and CANCELLED follow.

**Each card shows:**
- Vehicle plate + brand/model
- Status badge (large)
- Client name
- Full scheduled date and time
- Address with map-pin icon

**Complete Installation button** — large, full-width blue button on PLANNED interventions. Opens `CompleteInterventionModal`.

**Complete Installation modal:**
- Loads available trackers from `GET /trackers/available` (only `IN_STOCK` ones).
- Searchable by IMEI.
- User selects a tracker and confirms.
- Calls `POST /interventions/:id/complete { trackerId }`.
- On 409 ("Tracker not available") a clear message is shown: _"This tracker was just taken, choose another"_ — and the available list automatically refreshes so the user can pick a different one.
- On success: notification + list refresh + modal closes.

**Empty state** — friendly card with an icon when no interventions are assigned.

---

## Role-Based Routing

```
/login              → public
/register           → public
/                   → redirects to /dashboard (manager) or /my-interventions (technician)
/dashboard          → STOCK_MANAGER only
/trackers           → STOCK_MANAGER only
/clients            → STOCK_MANAGER only
/vehicles           → STOCK_MANAGER only
/interventions      → STOCK_MANAGER only
/my-interventions   → TECHNICIAN only
/unauthorized       → shown when a role tries to access a forbidden route
```

`ProtectedRoute` reads the role from `AuthContext`. While the session is being rehydrated from `localStorage` it shows a full-screen `Loader`. If the user is not authenticated it redirects to `/login`. If the user is authenticated but the role is wrong it redirects to `/unauthorized`.

---

## API Layer

All HTTP calls go through a single Axios instance (`src/api/axios.ts`):

**Request interceptor** — reads `accessToken` from `localStorage` and attaches it as `Authorization: Bearer <token>` on every request.

**Response interceptor** — handles errors globally:

| Status | Behaviour |
|---|---|
| 401 | Clears token + user from localStorage, shows "Session expired" notification, redirects to `/login` |
| 403 | Shows "Forbidden" notification with the server message |
| 404 | Shows "Not found" notification |
| 409 | Shows "Conflict" notification in orange |
| 5xx | Shows "Server error" notification |

Each resource has its own typed API module:

- `auth.ts` — `register`, `verifyOtp`, `login`, `verifyLoginOtp`, `me`
- `trackers.ts` — `list` (paginated), `available`, `get`, `create`, `update`, `updateStatus`, `history`, `remove`
- `clients.ts` — `list` (with optional search), `create`, `update`, `remove`
- `vehicles.ts` — `list` (optional clientId filter), `create`, `update`, `remove`
- `interventions.ts` — `list` (filters: status, technicianId, date), `create`, `cancel`, `complete`
- `dashboard.ts` — `get`

---

## Auth Context

`AuthContext` (`src/context/AuthContext.tsx`) is the single source of truth for authentication state. It is initialised synchronously from `localStorage` and then verified against `GET /auth/me` on every app load. If the stored token is expired or invalid the session is silently cleared.

Exposed values:

| Value | Description |
|---|---|
| `user` | Current `User` object (id, username, fullName, role, email) |
| `token` | Raw JWT string |
| `loading` | `true` during the initial `/auth/me` check |
| `isAuthenticated` | `true` when both `user` and `token` are set |
| `login(identifier, password)` | Returns `{ email, devOtp? }` — does NOT issue the JWT yet |
| `verifyLoginOtp(email, otp)` | Completes login, stores JWT + user |
| `register(data)` | Returns `{ email, devOtp? }` |
| `verifyOtp(email, otp)` | Completes registration, stores JWT + user |
| `logout()` | Clears localStorage + resets state |

---

## UX Patterns

These patterns are applied consistently across every screen:

- **Loading state** — centred `Loader` (or `Loader` with dots for full-page) while data is being fetched.
- **Empty state** — icon + descriptive text, with a CTA button where appropriate.
- **Error state** — dismissable `Alert` with the server message.
- **Debounced search** — 350 ms debounce via `useDebouncedValue` hook on all text filters.
- **Client-side pagination** — 10 rows per page with Mantine `Pagination` component.
- **Confirm modals** — destructive actions (delete, cancel) always ask for confirmation via `modals.openConfirmModal`.
- **Notifications** — all success and error feedback uses Mantine `notifications` (top-right).
- **Disabled states** — action buttons are disabled with an explanatory tooltip when the action is not possible (e.g. delete blocked by related records, status change not allowed).
- **Form validation** — client-side before the API call; server errors are mapped back to the relevant field where possible.
- **Dark mode** — forced dark theme via `MantineProvider forceColorScheme="dark"`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the value:

```env
VITE_API_URL=http://localhost:3000
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the NestJS API | `http://localhost:3000` |

---

## Getting Started

**Prerequisites:** Node.js ≥ 18, npm ≥ 9. The backend must be running and accessible at `VITE_API_URL`.

```bash
# 1. Clone and install
git clone <repo-url>
cd GPS_TRACKER_front
npm install

# 2. Configure environment
cp .env.example .env
# Edit VITE_API_URL if your backend runs on a different port or host

# 3. Start the dev server
npm run dev
# App is available at http://localhost:5173

# 4. Build for production
npm run build

# 5. Preview the production build locally
npm run preview
```

---

## Test Accounts

These accounts are created by the backend seed (`npm run seed` in `GPS_TRACKER_Back`).

| Username | Password | Role |
|---|---|---|
| `manager` | `Manager123!` | STOCK_MANAGER |
| `tech1` | `Tech123!` | TECHNICIAN |
| `tech2` | `Tech123!` | TECHNICIAN |

> **Note:** Login requires OTP verification. In development mode the API returns `devOtp` in the response body and the UI shows a "Use this code" panel, so no real email server is needed.

---

## What Is Done / Not Done

### Done

- Two-step OTP authentication (login + registration) with dev-mode bypass
- Role-based routing and protected routes
- Full STOCK_MANAGER experience: Dashboard, Trackers, Clients, Vehicles, Interventions
- Full TECHNICIAN experience: My Interventions + Complete Installation modal
- Tracker status transition enforcement in the UI (only valid transitions are offered)
- Tracker history drawer (full audit trail per tracker)
- Dashboard analytics: KPI cards, donut chart, bar chart, technician summary table, low-stock alert
- Global API error handling with contextual notifications
- Loading, empty, and error states on every screen
- Debounced search and filter controls
- Pagination (server-side for trackers, client-side for others)
- Mantine confirm modals for all destructive actions
- Dark mode enforced globally
- Responsive layout (collapsible sidebar on mobile)

### Not Done / Known Limitations

- No date-range filter on the Interventions page (status + technician only)
- No optimistic UI updates (every mutation triggers a full refetch)
- No unit or integration tests for React components
- No PWA / offline support
- Technician screen is not fully native-mobile optimised (no swipe gestures, no push notifications)

---

## Possible Improvements

- Add React Query or SWR for caching, background refetch, and optimistic updates
- Date range filter on the Interventions page
- Map view showing vehicle locations via a lightweight map library
- Push/email notifications for technicians when a new intervention is assigned
- Component tests with Vitest + Testing Library
- PWA manifest and service worker for offline resilience on the technician screen
- Export to CSV/PDF for the manager screens
