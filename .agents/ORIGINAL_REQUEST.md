# Original User Request

## 2026-08-27T09:21:24Z

Professional UI/UX redesign of an existing Meal CRM (meal delivery service management) from a generic FastAPI starter template into a polished, production-grade business application for a non-technical manager in Kyrgyzstan.

Working directory: F:\ATLAS\ATLAS-002-meal-crm
Integrity mode: development

## Context

This is an existing, functional Meal CRM MVP built with:
- **Backend:** FastAPI + SQLModel + PostgreSQL (DO NOT MODIFY)
- **Frontend:** React + TanStack Router + shadcn/ui + Tailwind CSS v4
- **Tests:** Playwright E2E (75 tests)
- **Language:** All UI text is in Russian
- **Currency:** KGS (Kyrgyzstani Som), locale `ru-KG`

The backend, database schema, API contracts, and business logic are **frozen** — no changes allowed. All work is strictly frontend.

The application is served by the backend at `localhost:8000` (Vite builds into `backend/app/frontend/`). To test: `docker compose up -d --build backend`.

### Design Skills Available
The repository contains three design skill files that MUST be read and followed:
- `.agents/skills/frontend-design/SKILL.md` — Visual identity, typography, intentional aesthetic
- `.agents/skills/ui-ux-pro-max/SKILL.md` — Design system tokens, CRM UX patterns, semantic colors
- `.agents/skills/web-design-guidelines/SKILL.md` — Accessibility, focus states, forms, typography rules

### Approved Design Concept (MUST follow)
A detailed design concept has been approved by the user at:
`C:\Users\iclou\.gemini\antigravity\brain\1baa4af4-1fc6-43f9-ac37-ba067ec0237c\implementation_plan.md`

Key design decisions already approved:
- **Color system:** Fresh Emerald/Jade primary (`oklch(0.54 0.15 156)`), semantic status colors (emerald=active, amber=paused, rose=debt, slate=completed)
- **Logo:** Replace FastAPI branding with "Atlas Meal CRM" using `UtensilsCrossed` lucide icon
- **Footer:** Replace FastAPI template links with "Atlas Meal CRM • Система управления доставкой рационов питания"
- **Dashboard:** Operational cockpit with hero delivery card, KPI grid, "Requires attention" action list, meal type breakdown chart
- **Package Card:** 3-zone layout (Status → Progress bar → Financials), not 14 flat grey tiles
- **Client List:** Filter pills with live counts instead of hidden select dropdown
- **Typography:** `tabular-nums` for all financial/numeric data, `text-wrap: balance` for headings

### Current State (partially started)
Some changes have already been applied to `main`:
- `index.css` — color tokens updated to emerald palette (both light and dark)
- `Logo.tsx` — replaced with UtensilsCrossed icon + "Atlas Meal" text
- `Footer.tsx` — replaced with Atlas Meal CRM branding
- `_layout.tsx` — header updated with date display and status badge
- `index.tsx` (Dashboard) — partially rewritten with new KPI cockpit (needs review/completion)
- Translation to Russian — already complete across all components
- Currency — already changed from RUB to KGS

Review these existing changes before modifying them further.

## Requirements

### R1. Dashboard Redesign
Transform the dashboard (`frontend/src/routes/_layout/index.tsx`) into an operational cockpit that answers "What matters today?" for a meal delivery manager.

Must include: hero delivery count card (with `data-testid="todays-deliveries-value"` preserved), active clients with total count, expiring packages (7-day warning), total debt amount with debtor count, "Requires attention" action list showing top clients needing callbacks (expiring packages + unpaid debts), and meal type breakdown (3X vs 5X) with daily production estimate.

### R2. Client List Redesign
Redesign the client list page (`frontend/src/routes/_layout/clients.tsx`) to support fast daily workflow.

Replace the hidden status dropdown with visible filter pills showing live counts per status. Enhance the table with avatar initials + status dot, clickable phone numbers, address with map pin icon, mini package summary inline (e.g., "3X • ост. 6 дн."), debt badge, and clear "Open" CTA. Maintain the existing `AddClientDialog` functionality.

### R3. Client Detail & Package Card Redesign
Redesign the client detail page (`frontend/src/routes/_layout/clients.$clientId.tsx`) and package card (`frontend/src/components/Clients/PackageCard.tsx`).

Client profile header: avatar with initials, name, status badge, contact info (phone, address, email), quick debt indicator, edit button. Package card: replace the 14 flat data tiles with a 3-zone layout: (1) header with type/dates/status, (2) visual delivery progress bar showing used/remaining/frozen/extended days, (3) financial summary as three prominent numbers (Total obligation, Paid, Debt). Keep action buttons (delivery, payment, freeze, extension, status change) visible without extra clicks. Delivery history must clearly distinguish "День питания клиента" from "Дата отправки курьером (за 1 день до еды)".

### R4. Design System & Global Shell
Apply the approved emerald color palette consistently. Ensure the sidebar, header, footer, auth pages (login, signup, password reset), admin panel, and settings pages all use the new visual identity. Remove any remaining FastAPI template branding. All numeric data must use `tabular-nums`. Ensure responsive layout works on desktop, tablet, and mobile without horizontal overflow.

### R5. Test Compatibility
All changes must preserve compatibility with existing Playwright E2E tests. Key selectors that MUST be preserved:
- `data-testid="todays-deliveries-value"` on dashboard
- Button text "Добавить клиента", "Добавить пользователя", "Сохранить", "Отменить", "Удалить", "Войти", "Зарегистрироваться"
- Dialog titles and form placeholders used in test assertions
- `getByLabel`, `getByPlaceholder`, `getByRole` selectors used in `tests/utils/user.ts`

Do not weaken tests to make them pass. Fix the UI to match test expectations, or update test selectors only when the UI intentionally changes a label.

## Acceptance Criteria

### Build & Type Safety
- [ ] `npm run build` in `frontend/` completes with zero errors (this runs `tsc` + Vite build)
- [ ] No TypeScript type errors

### Visual Redesign Quality
- [ ] Dashboard displays an operational cockpit layout (not 6 identical grey stat cards)
- [ ] Dashboard hero card for "Доставки на сегодня" is visually prominent and uses emerald accent
- [ ] Dashboard includes an "action center" listing clients needing attention (debts/expiring)
- [ ] Client list shows filter pills with status counts, not a hidden dropdown
- [ ] Client table rows contain status badge, phone, address, and an action button
- [ ] Package card uses a progress bar for delivery days (not a flat grid of 14 tiles)
- [ ] Package card shows three clear financial numbers: Total, Paid, Debt
- [ ] FastAPI logo and branding are completely removed — replaced with "Atlas Meal CRM"
- [ ] Footer says "Atlas Meal CRM" not "Full Stack FastAPI Template"
- [ ] All financial numbers use `tabular-nums` font variant

### Functional Integrity
- [ ] Backend is not modified (no changes to files outside `frontend/`)
- [ ] `git diff --name-only` shows only files under `frontend/` and `.agents/`
- [ ] All existing CRM operations work: create client, add package, record delivery, record payment, freeze, extend, change status, add notes
- [ ] Currency displays as KGS (сом), not RUB

### Playwright Tests
- [ ] Run `npx playwright test` in `frontend/` directory with backend running (`docker compose up -d db mailpit backend`)
- [ ] At least 50 of 75 tests pass (some may fail due to Vite dev server resource limits in parallel mode — this is acceptable if the failures are `ERR_CONNECTION_REFUSED` timeout errors, not selector mismatches)
- [ ] Zero test failures caused by missing/renamed UI elements that the tests depend on

### Responsive & Accessibility
- [ ] No horizontal scrollbar on mobile viewport (375px width)
- [ ] All interactive elements have visible focus states
- [ ] Icon-only buttons have `aria-label`

## 2026-08-27T18:37:33Z

Continue the professional UI/UX redesign of an existing Meal CRM (meal delivery service for Kyrgyzstan). A previous teamwork run completed Phase 0 exploration and Milestone 1 (Design System & Global Shell). The build passes. The remaining work is R2 (Client List) and R3 (Client Detail + Package Card).

Working directory: F:\ATLAS\ATLAS-002-meal-crm
Integrity mode: development

## Context

This is an existing, functional Meal CRM MVP:
- **Backend:** FastAPI + SQLModel + PostgreSQL (FROZEN — DO NOT MODIFY)
- **Frontend:** React + TanStack Router + shadcn/ui + Tailwind CSS v4
- **Tests:** Playwright E2E (75 tests, all text in Russian)
- **Currency:** KGS (Kyrgyzstani Som), locale `ru-KG`
- **Build:** `npm run build` in `frontend/` passes with zero errors right now

All work is strictly inside `frontend/`. The backend serves the compiled frontend from `backend/app/frontend/`.

### What's Already Done (DO NOT REDO)
- `index.css` — emerald color tokens (primary `oklch(0.54 0.15 156)`), both light and dark themes
- `Logo.tsx` — Atlas Meal CRM branding with UtensilsCrossed icon
- `Footer.tsx` — Atlas Meal CRM footer (no more FastAPI links)
- `_layout.tsx` — header with date display and status badge
- `index.tsx` (Dashboard) — operational cockpit with hero delivery card, KPI grid, action center, meal breakdown
- Auth pages (login, signup, password reset) — styled
- Admin panel, settings, sidebar — styled
- All UI text translated to Russian
- Currency changed from RUB to KGS

### Design Skills (MUST read before implementing)
- `.agents/skills/frontend-design/SKILL.md` — Visual identity
- `.agents/skills/ui-ux-pro-max/SKILL.md` — CRM UX patterns, semantic colors
- `.agents/skills/web-design-guidelines/SKILL.md` — Accessibility, forms, focus states

### Approved Design Concept
See `C:\Users\iclou\.gemini\antigravity\brain\1baa4af4-1fc6-43f9-ac37-ba067ec0237c\implementation_plan.md`

Key decisions:
- Emerald=active, Amber=paused, Rose=debt, Slate=completed
- `tabular-nums` for all financial/numeric data
- Filter pills with live counts (not hidden dropdown)
- Package card: 3-zone layout (Status → Progress bar → Financials)

## Requirements

### R1. Client List Redesign
Redesign `frontend/src/routes/_layout/clients.tsx`.

Replace the hidden status `<Select>` dropdown (lines ~186-212) with visible horizontal filter pills showing live counts per status. Each pill shows the status name and count (e.g., "Активные (48)"). The pills must support: Все, Активные, С долгом, На паузе, Новые, Завершенные, Архивированные.

Enhance each table row to include:
- Avatar circle with client initials and a colored status dot
- Client name as a clickable link
- Phone number with Phone icon
- Address with MapPin icon (or "—" if empty)
- Status badge with semantic color coding
- Date added
- Clear "Открыть" action button

Keep the existing search input and `AddClientDialog` button unchanged. The `AddClientDialog` component is already in the file — do not break it.

Empty state when no clients match filters: show a friendly message with an icon.

### R2. Client Detail Page Redesign
Redesign `frontend/src/routes/_layout/clients.$clientId.tsx`.

Client profile header should include:
- Avatar with initials (colored circle based on status)
- Client name (large, bold)
- Status badge with semantic color
- Phone, address, email with icons
- Quick debt indicator if debt > 0 (red badge)
- Edit button
- Back navigation link

Keep the existing tab structure (Пакеты питания / Заметки менеджера). Keep `EditClientDialog`, `AddPackageDialog`, `AddNoteForm` imports and usage unchanged.

### R3. Package Card 3-Zone Redesign
Redesign `frontend/src/components/Clients/PackageCard.tsx`.

This is the most critical visual change. Replace the current layout (14 flat grey `SummaryLine` tiles in a grid + hidden expandable details) with a 3-zone card:

**Zone 1 — Header:** Package type ("Пакет 3X" or "Пакет 5X"), date range (start → end), status badge, debt badge if > 0.

**Zone 2 — Delivery Progress:** A visual progress bar showing `days_used / (total_days + extension_days)` as a percentage. Show labels: "Использовано X из Y дней (Z%)". Below the bar, show compact badges: "Базовых: N", "Продлено: +N", "Заморожено: N".

**Zone 3 — Financial Summary:** Three prominent numbers side by side:
- "Итого к оплате" = price + extension_added_price
- "Оплачено" = paid_amount
- "Остаток / Долг" = debt (highlighted red if > 0)

**Action buttons:** Keep all existing action dialogs (AddPaymentDialog, AddDeliveryDialog, AddFreezeDialog, AddExtensionDialog, UpdatePackageStatusDialog) as visible buttons, not hidden behind expand. Show them in a horizontal row below the financial summary.

**Expandable history:** Keep the expand/collapse for detailed history (payments, deliveries, freezes, extensions) but move it below the action buttons.

Do NOT change any dialog logic, form schemas, or mutation functions. Only restructure the visual layout of the `PackageCard` component and the helper components `SummaryLine` and `SectionCard`.

## Acceptance Criteria

### Build & Type Safety
- [ ] `npm run build` in `frontend/` completes with zero errors
- [ ] No TypeScript type errors

### Client List (R1)
- [ ] Status filter pills are visible as horizontal buttons/badges (not a hidden select dropdown)
- [ ] Each pill shows a count number
- [ ] Client table rows show a colored avatar circle with initials
- [ ] Phone numbers have a Phone icon
- [ ] The "Добавить клиента" button and AddClientDialog still work
- [ ] Search input still filters by name, phone, address

### Client Detail (R2)
- [ ] Client header shows avatar with initials
- [ ] Status badge uses semantic colors (emerald/amber/rose/slate)
- [ ] Debt indicator is visible when client has debt > 0
- [ ] Edit button and EditClientDialog still work
- [ ] Tab navigation between Пакеты and Заметки still works

### Package Card (R3)
- [ ] Progress bar is visible showing used/total days as a filled bar
- [ ] Three financial numbers (Total, Paid, Debt) are displayed prominently
- [ ] Debt number is highlighted in red/rose when > 0
- [ ] All action buttons (payment, delivery, freeze, extension, status) are visible without expanding
- [ ] All action dialogs still function correctly (forms submit, mutations fire)
- [ ] History sections (payments, deliveries, freezes, extensions) are in an expandable area
- [ ] The old 14-tile SummaryLine grid is gone

### Functional Integrity
- [ ] No files outside `frontend/` are modified
- [ ] All existing CRM operations work: create client, add package, record delivery, record payment, freeze, extend, change status, add notes
- [ ] Currency displays as KGS

### Playwright Compatibility
- [ ] Button text "Добавить клиента", "Добавление клиента", "Сохранить", "Отменить" preserved
- [ ] `data-testid` attributes preserved where they exist
- [ ] Dialog titles and form labels match what Playwright tests expect

