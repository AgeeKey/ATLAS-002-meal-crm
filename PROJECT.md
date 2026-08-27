# Project: Atlas Meal CRM UI/UX Redesign

## Architecture
Atlas Meal CRM is a specialized B2B management system for healthy meal delivery services in Kyrgyzstan.
- **Frontend Stack:** React 18, TanStack Router, TanStack Query, shadcn/ui, Tailwind CSS v4, Lucide Icons.
- **Backend Stack (Frozen):** FastAPI, SQLModel, PostgreSQL, Mailpit (served at `localhost:8000`).
- **Locale & Currency:** Russian UI text, KGS (сом, `ru-KG`), `tabular-nums` formatting for all metrics and monetary values.
- **Design Language:** Fresh Emerald / Jade modern SaaS minimalism (`oklch(0.54 0.15 156)` light / `oklch(0.66 0.15 156)` dark), semantic status indicators (Emerald, Amber, Coral/Rose, Slate), clean card elevations.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Forest Emerald Design Tokens & Typography | Implement OKLCH emerald design system, semantic status colors, dark/light mode tokens, and `tabular-nums` across all numbers | M1 | ORIGINAL_REQUEST §R4, implementation_plan §1 |
| F2 | Branded Global Shell & Navigation | Replace all legacy FastAPI branding with Atlas Meal CRM logo (`UtensilsCrossed`), operational header with live date/shift badge, sidebar with Russian nav, live server status footer | M1 | ORIGINAL_REQUEST §R4, implementation_plan §1.1 |
| F3 | Auth Suite & Admin UI Polish | Polish Login, Signup, Password Recovery, Profile settings, and Admin User management with Russian labels ("Сохранить", "Отменить", "Удалить") | M1 | ORIGINAL_REQUEST §R4, survey_test_explorer_3 |
| F4 | Dashboard Hero Today's Deliveries Card | Prominent emerald hero card showing today's delivery count, preserving `data-testid="todays-deliveries-value"` | M2 | ORIGINAL_REQUEST §R1, implementation_plan §2.1 |
| F5 | Dashboard KPI Cockpit Grid | Active clients count, expiring packages (7-day alert), total debt sum with debtor client count | M2 | ORIGINAL_REQUEST §R1, implementation_plan §2.1 |
| F6 | Dashboard Attention Action Center | Action list for top clients needing immediate manager callbacks (critical debts & soon-expiring subscriptions) | M2 | ORIGINAL_REQUEST §R1, implementation_plan §2.1 |
| F7 | Dashboard Meal Breakdown & Kitchen Analytics | Analytics widget displaying 3X vs 5X distribution and daily portion production estimate | M2 | ORIGINAL_REQUEST §R1, implementation_plan §2.1 |
| F8 | Client List Status Filter Pills | Horizontal interactive filter pills (`Все`, `Активные`, `С долгом`, `На паузе`, `Новые`, `Завершенные`, `Архив`) with live counter badges | M3 | ORIGINAL_REQUEST §R2, implementation_plan §4.1 |
| F9 | Client Table Rich Micro-Cards | Enriched rows with initials avatar + status dot, clickable phone, address with pin, inline package summary (`3X • ост. 8 дн.`), debt pill, and action CTA | M3 | ORIGINAL_REQUEST §R2, implementation_plan §4.2 |
| F10 | Client Creation Modal Integration | Seamless `AddClientDialog` with validated Russian form labels (`"Имя *"`, `"Телефон *"`, `"Email"`) and instant table update | M3 | ORIGINAL_REQUEST §R2, tests/clients.spec.ts |
| F11 | Client Profile Header & Quick Stats | Profile hero with initials avatar, status badge, debt badge, copyable phone, address, and client info editing | M4 | ORIGINAL_REQUEST §R3, implementation_plan §3.1 |
| F12 | 3-Zone Package Card Architecture | Zone 1: Plan/Status/Dates Header; Zone 2: Visual Delivery Progress Bar (used/remaining/frozen/extended); Zone 3: Financial Trio (Total / Paid / Debt) | M4 | ORIGINAL_REQUEST §R3, implementation_plan §3.2 |
| F13 | Package 1-Click Operations & Dialogs | Immediate action buttons for Delivery, Payment, Freeze, Extension, and Status update with zero deep nesting | M4 | ORIGINAL_REQUEST §R3, implementation_plan §3.2 |
| F14 | Humanized Delivery History & Notes | Detailed history with "День питания клиента" vs "Дата отправки курьером накануне" and note authoring with label `"Новая заметка"` | M4 | ORIGINAL_REQUEST §R3, survey_test_explorer_3 |
| F15 | End-to-End Test Suite Compatibility | Verify 75 Playwright tests, zero regressions on critical selectors, mobile 375px responsive layout, and WCAG AA focus visibility | M5 | ORIGINAL_REQUEST §R5, survey_test_explorer_3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Design System, Shell & Auth Polish (R4) | `frontend/src/index.css`, `frontend/src/components/Common/*`, `frontend/src/routes/_layout.tsx`, Auth & Admin pages | none | PLANNED |
| M2 | Dashboard Operational Cockpit (R1) | `frontend/src/routes/_layout/index.tsx`, Dashboard widgets | M1 | PLANNED |
| M3 | Client List with Filter Pills & Micro-Cards (R2) | `frontend/src/routes/_layout/clients.tsx`, `AddClientDialog.tsx` | M1 | PLANNED |
| M4 | Client Detail & 3-Zone Package Card (R3) | `frontend/src/routes/_layout/clients.$clientId.tsx`, `PackageCard.tsx`, Action Dialogs, `AddNoteForm.tsx` | M1 | PLANNED |
| M5 | E2E Testing Validation, A11y & Polish (R5) | Full Playwright suite execution, responsive testing (375px), WCAG focus states | M2, M3, M4 | PLANNED |

## Code Layout
```
frontend/src/
├── index.css                                # Design tokens, OKLCH palette, tabular-nums utilities
├── main.tsx
├── routeTree.gen.ts
├── routes/
│   ├── _layout.tsx                          # Global layout shell (Navbar, Header with live date, Sidebar, Footer)
│   ├── _layout/
│   │   ├── index.tsx                        # M2: Operational Dashboard Cockpit
│   │   ├── clients.tsx                      # M3: Client List with Filter Pills
│   │   ├── clients.$clientId.tsx            # M4: Client Profile Header & Details
│   │   ├── admin.tsx                        # M1: Admin Users Management
│   │   └── settings.tsx                     # M1: User Profile & Preferences
│   ├── login.tsx                            # M1: Branded Login Page
│   ├── signup.tsx                           # M1: Branded Signup Page
│   ├── recover-password.tsx                 # M1: Branded Password Recovery
│   └── reset-password.tsx                   # M1: Branded Password Reset
├── components/
│   ├── Common/
│   │   ├── Logo.tsx                         # Atlas Meal CRM logo with UtensilsCrossed
│   │   ├── Footer.tsx                       # Live status footer
│   │   ├── Navbar.tsx / Sidebar.tsx         # Sidebar navigation & theme toggle
│   │   ├── UserMenu.tsx                     # User dropdown
│   │   └── Appearance.tsx                   # Theme switcher
│   ├── Admin/
│   │   ├── AddUser.tsx, EditUser.tsx, DeleteUser.tsx # Russian button labels
│   ├── Clients/
│   │   ├── AddClientDialog.tsx              # Add client modal
│   │   ├── PackageCard.tsx                  # M4: 3-Zone Package Card (Progress Bar + Financial Trio)
│   │   ├── AddPackageDialog.tsx             # Add subscription package
│   │   ├── AddDeliveryDialog.tsx            # Record delivery
│   │   ├── AddPaymentDialog.tsx             # Record payment
│   │   ├── AddFreezeDialog.tsx              # Freeze subscription days
│   │   ├── AddExtensionDialog.tsx           # Extend subscription days
│   │   ├── ChangeStatusDialog.tsx           # Update package status
│   │   └── AddNoteForm.tsx                  # Client note form (label: "Новая заметка")
│   └── ui/                                  # shadcn/ui primitives
```

## Interface Contracts
- **Backend API:** All endpoints in `frontend/src/client/` are frozen and utilized as-is without modification.
- **Client Status Enum:** `active` | `paused` | `debt` | `new` | `completed` | `archived`.
- **Package Status Enum:** `active` | `paused` | `completed` | `cancelled`.
- **Meal Types:** `3X` (3 meals/day), `5X` (5 meals/day).
- **Selector Contract:**
  - Hero deliveries: `data-testid="todays-deliveries-value"`
  - Package card expander: text containing `"Подробнее"`
  - Client note input: `page.getByLabel("Новая заметка")`
  - Auth testids: `email-input`, `password-input`, `full-name-input`, `confirm-password-input`, `new-password-input`, `current-password-input`, `user-menu`, `theme-button`, `light-mode`, `dark-mode`
