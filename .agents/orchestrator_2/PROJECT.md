# Project: Atlas Meal CRM UI/UX Redesign (Phase 2: R1, R2, R3)

## Architecture
- Frontend: React 18, Vite, TanStack Router, TanStack Query, shadcn/ui, Tailwind CSS v4, Lucide React icons
- Backend: FastAPI (frozen at localhost:8000, DO NOT MODIFY)
- Test Suite: Playwright E2E tests

## Code Layout
- Client List: `frontend/src/routes/_layout/clients.tsx`
- Client Detail: `frontend/src/routes/_layout/clients.$clientId.tsx`
- Package Card: `frontend/src/components/Clients/PackageCard.tsx`
- Dialogs / Shared Client Components: `frontend/src/components/Clients/`
- UI Components: `frontend/src/components/ui/`
- Design Tokens / CSS: `frontend/src/index.css`

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Client List Filter Pills | Replace hidden Select dropdown with horizontal filter pills with live counts (Все, Активные, С долгом, На паузе, Новые, Завершенные, Архивированные) | M1 | ORIGINAL_REQUEST.md § R1 |
| 2 | Client List Row Enhancement | Avatar initials with status dot, clickable name, phone with icon, address with MapPin icon, semantic status badge, date added, "Открыть" CTA | M1 | ORIGINAL_REQUEST.md § R1 |
| 3 | Client List Empty State & Preservation | Friendly empty state with icon, retain AddClientDialog and search input | M1 | ORIGINAL_REQUEST.md § R1 |
| 4 | Client Detail Profile Header | Avatar with initials & status color, large bold name, status badge, phone/address/email with icons, red debt badge if debt > 0, edit button, back link | M2 | ORIGINAL_REQUEST.md § R2 |
| 5 | Client Detail Structure & Tabs | Retain tabs (Пакеты питания / Заметки менеджера), keep EditClientDialog, AddPackageDialog, AddNoteForm untouched | M2 | ORIGINAL_REQUEST.md § R2 |
| 6 | Package Card 3-Zone Layout | Zone 1: Header (type, date range, status/debt badges); Zone 2: Delivery Progress bar (days used / total, compact badges); Zone 3: Financial Summary (Total, Paid, Debt) | M3 | ORIGINAL_REQUEST.md § R3 |
| 7 | Package Card Action Buttons & History | Direct horizontal action buttons row (Payment, Delivery, Freeze, Extension, Status); expandable history below actions; remove old 14-tile grid | M3 | ORIGINAL_REQUEST.md § R3 |
| 8 | E2E & Type Integrity | Zero TS errors, `npm run build` passes, Playwright selector compatibility, tabular-nums for numeric/financials | Verification | ORIGINAL_REQUEST.md § Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 0 | Survey & Exploration | Detailed analysis of `clients.tsx`, `clients.$clientId.tsx`, `PackageCard.tsx`, test selectors, and design skills | none | DONE |
| 1 | M1: Client List Redesign | `frontend/src/routes/_layout/clients.tsx` | M0 | DONE |
| 2 | M2: Client Detail Page Redesign | `frontend/src/routes/_layout/clients.$clientId.tsx` | M0 | DONE |
| 3 | M3: Package Card 3-Zone Redesign | `frontend/src/components/Clients/PackageCard.tsx` | M0 | DONE |
| 4 | Final Verification & Audit | E2E test verification, multi-reviewer check, challenger stress check, forensic audit | M1, M2, M3 | DONE |

## Interface Contracts & Constraints
- Status color tokens: Emerald (`text-emerald-700 bg-emerald-50 border-emerald-200 dark:...`), Amber (paused), Rose (debt), Slate (completed)
- Financial formatting: `tabular-nums`, KGS currency symbol / "сом"
- Playwright selectors preserved: Button texts ("Добавить клиента", "Сохранить", "Отменить", etc.), input placeholders, dialog labels
