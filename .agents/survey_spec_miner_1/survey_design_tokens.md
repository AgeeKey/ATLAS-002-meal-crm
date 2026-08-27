# Survey Report: Design Tokens, Visual Identity & UI/UX Guidelines

**Target Application:** Atlas Meal CRM  
**Date:** 2026-08-27  
**Author:** Specification Miner (`survey_spec_miner_1`)  
**Audience:** Orchestrator, Frontend Developers, QA Engineers  

---

## 1. Executive Summary

This survey provides a comprehensive audit of the design system, visual identity, token inventory, and UI/UX guideline compliance for **Atlas Meal CRM**.

Atlas Meal CRM is a specialized operational management tool designed for non-technical managers of meal delivery subscription services in Kyrgyzstan (currency: KGS / сом, locale: `ru-KG`). The frontend is built on **React 19**, **TanStack Router**, **Tailwind CSS v4**, **shadcn/ui** primitives, and **Lucide Icons**, tested via **Playwright E2E** (75 tests).

Authoritative specification sources referenced:
1. Approved architectural & UI/UX concept: `implementation_plan.md`
2. Core requirements: `ORIGINAL_REQUEST.md`
3. Design skills:
   - `.agents/skills/frontend-design/SKILL.md` (Distinctive visual identity, culinary theme, opinionated typography)
   - `.agents/skills/ui-ux-pro-max/SKILL.md` (B2B dashboard cockpit, semantic status tokens, non-technical Russian copy)
   - `.agents/skills/web-design-guidelines/SKILL.md` (Web accessibility, focus states, forms, tabular numerals)
4. Frontend codebase (`frontend/src/index.css`, layout components, routes, UI primitives, test suites).

---

## 2. Complete Design Token Inventory

Tailwind CSS v4 is configured via CSS custom properties and `@theme inline` in `frontend/src/index.css`. All core colors use the modern **OKLCH** color space for perceptual uniformity and vibrant chromatic rendering.

### 2.1 Theme Dimensions & Border Radii
| Token | CSS Variable | Value | Description / Usage |
|---|---|---|---|
| `--radius-sm` | `calc(var(--radius) - 4px)` | `0.5rem (8px)` | Small badges, micro-chips, nested elements |
| `--radius-md` | `calc(var(--radius) - 2px)` | `0.625rem (10px)` | Buttons, standard inputs, tooltips |
| `--radius-lg` | `var(--radius)` | `0.75rem (12px)` | Cards, dialog modals, dropdown menus |
| `--radius-xl` | `calc(var(--radius) + 4px)` | `1.0rem (16px)` | Hero containers, large stat sections |

---

### 2.2 Color System & Palette Matrix (OKLCH)

#### A. Core Base Tokens
| Token | Light Mode (`:root`) | Dark Mode (`.dark`) | Semantic Role |
|---|---|---|---|
| `background` | `oklch(0.99 0.002 120)` | `oklch(0.14 0.015 240)` | Global page background; warm off-white in light, midnight slate in dark |
| `foreground` | `oklch(0.18 0.02 240)` | `oklch(0.98 0.005 240)` | Primary high-contrast text |
| `card` | `oklch(1 0 0)` | `oklch(0.18 0.018 240)` | Elevated card surfaces |
| `card-foreground` | `oklch(0.18 0.02 240)` | `oklch(0.98 0.005 240)` | Content inside cards |
| `popover` | `oklch(1 0 0)` | `oklch(0.18 0.018 240)` | Dropdown menus, selects, tooltips |
| `popover-foreground` | `oklch(0.18 0.02 240)` | `oklch(0.98 0.005 240)` | Content inside popovers |
| `primary` | `oklch(0.54 0.15 156)` | `oklch(0.66 0.15 156)` | **Fresh Forest Emerald / Jade**; primary buttons, brand accents |
| `primary-foreground` | `oklch(0.99 0 0)` | `oklch(0.12 0.03 156)` | Text on primary buttons (crisp white in light, dark forest in dark) |
| `secondary` | `oklch(0.96 0.01 150)` | `oklch(0.24 0.02 150)` | Subdued secondary containers, soft mint tone |
| `secondary-foreground`| `oklch(0.24 0.03 150)` | `oklch(0.96 0.01 150)` | Text on secondary elements |
| `muted` | `oklch(0.96 0.005 240)` | `oklch(0.22 0.015 240)` | Neutral backgrounds, table headers, inactive tabs |
| `muted-foreground` | `oklch(0.52 0.02 240)` | `oklch(0.68 0.02 240)` | Secondary labels, timestamps, helper descriptions |
| `accent` | `oklch(0.95 0.02 155)` | `oklch(0.24 0.03 155)` | Hover state highlights, subtle badge backgrounds |
| `accent-foreground` | `oklch(0.22 0.05 155)` | `oklch(0.96 0.02 155)` | Text on accent elements |
| `destructive` | `oklch(0.58 0.22 25)` | `oklch(0.65 0.22 25)` | Coral / Rose Red; debt indicators, delete actions, errors |
| `border` | `oklch(0.91 0.005 240)` | `oklch(0.28 0.015 240)` | Subtle component borders |
| `input` | `oklch(0.91 0.005 240)` | `oklch(0.28 0.015 240)` | Form control borders |
| `ring` | `oklch(0.54 0.15 156)` | `oklch(0.66 0.15 156)` | Keyboard focus ring (matches emerald primary) |

#### B. Data Visualization / Chart Tokens
| Chart Token | OKLCH Light | OKLCH Dark | Visual Meaning |
|---|---|---|---|
| `--chart-1` | `oklch(0.54 0.15 156)` | `oklch(0.66 0.15 156)` | Emerald (3X Meals / Primary Series) |
| `--chart-2` | `oklch(0.68 0.16 80)` | `oklch(0.72 0.16 80)` | Amber (Paused / Secondary Series) |
| `--chart-3` | `oklch(0.58 0.22 25)` | `oklch(0.65 0.22 25)` | Rose / Red (Debts / Negative Balances) |
| `--chart-4` | `oklch(0.60 0.12 220)` | `oklch(0.65 0.14 220)` | Cool Blue (5X Meals / Third Series) |
| `--chart-5` | `oklch(0.72 0.14 156)` | `oklch(0.78 0.12 156)` | Light Mint (Extensions / Growth) |

#### C. Sidebar Dedicated Tokens
| Sidebar Token | OKLCH Light | OKLCH Dark | Description |
|---|---|---|---|
| `--sidebar` | `oklch(0.985 0.005 150)` | `oklch(0.16 0.016 240)` | Light mint tinted sidebar surface |
| `--sidebar-foreground` | `oklch(0.22 0.02 240)` | `oklch(0.98 0.005 240)` | Nav text and icons |
| `--sidebar-primary` | `oklch(0.54 0.15 156)` | `oklch(0.66 0.15 156)` | Active item indicator |
| `--sidebar-primary-foreground`| `oklch(0.99 0 0)` | `oklch(0.12 0.03 156)` | Text on active nav items |
| `--sidebar-accent` | `oklch(0.94 0.02 155)` | `oklch(0.22 0.025 155)` | Nav item hover highlight |
| `--sidebar-accent-foreground`| `oklch(0.22 0.05 155)` | `oklch(0.96 0.02 155)` | Hovered text color |
| `--sidebar-border` | `oklch(0.92 0.005 240)` | `oklch(0.25 0.015 240)` | Vertical separator border |
| `--sidebar-ring` | `oklch(0.54 0.15 156)` | `oklch(0.66 0.15 156)` | Focus ring within sidebar |

---

### 2.3 Semantic Business Status Palette

The CRM uses an explicit, unambiguous color taxonomy:

| Status Key | Russian Label | Semantic Color | Tailwind Classes (Light / Dark) | Visual Micro-Indicator |
|---|---|---|---|---|
| `active` | Активен | **Emerald** | `bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20` | Pulsing green dot (`bg-emerald-500 animate-pulse`) |
| `paused` | На паузе | **Amber / Orange** | `bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30` | Static amber clock icon or dot |
| `debt` | Долг / Задолженность | **Rose / Coral** | `bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30` | Warning triangle (`AlertTriangle`) |
| `completed` | Завершен | **Slate / Neutral** | `bg-muted text-muted-foreground border-border` | Subtle checkmark |
| `new` | Новый | **Cyan / Soft Blue** | `bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20` | Sparkle / plus dot |
| `archived` | Архив | **Muted Slate** | `bg-muted/40 text-muted-foreground border-dashed` | Archive box icon |

---

### 2.4 Typography, Numeric Alignment & Elevation Tokens

1. **Typography Hierarchy:**
   - **Page Headings (`h1`):** `text-2xl` or `text-3xl font-bold tracking-tight text-foreground text-wrap: balance`
   - **Section Titles (`h2` / Card Titles):** `text-lg` or `text-xl font-semibold tracking-tight text-foreground`
   - **Subheadings / Descriptions:** `text-sm text-muted-foreground`
   - **Data Labels:** `text-xs font-semibold uppercase tracking-wider text-muted-foreground`
   - **Numeric / Financial Hero Values:** `text-3xl` or `text-4xl font-extrabold tracking-tight tabular-nums`

2. **Tabular Numerals (`tabular-nums`):**
   - In Tailwind CSS v4, `tabular-nums` applies `font-variant-numeric: tabular-nums`.
   - **Rule:** ALL currency values (`Intl.NumberFormat("ru-KG", { style: "currency", currency: "KGS" })`), days counts, delivery tallies, phone numbers, and dates in tables/cards MUST include the `tabular-nums` utility class. This prevents visual jitter when numbers refresh.

3. **Elevation & Glassmorphism:**
   - Cards use `shadow-sm` and explicit border color with background tint (e.g. `bg-card border`).
   - Sticky Top Bar: `backdrop-blur-xs bg-background/80 border-b`.
   - Sticky / Bottom Footer: `backdrop-blur-xs bg-background/50 border-t`.

---

## 3. Visual Identity Specifications

### 3.1 Brand Logo (`Logo.tsx`)
- **Icon Mark:** `UtensilsCrossed` from `lucide-react` (size `4` or `16px`) encased in a `size-8 rounded-lg bg-primary text-primary-foreground shadow-sm flex items-center justify-center`.
- **Logotype Text:**
  - Main: `Atlas Meal` (`text-sm font-bold tracking-tight text-foreground`)
  - Sub: `CRM • Питание` (`text-[9px] font-semibold uppercase tracking-wider text-muted-foreground`)
- **Supported Modes:**
  - `full`: Shows both icon mark and two-line logotype.
  - `icon`: Shows only the icon mark.
  - `responsive`: Automatically collapses logotype in collapsed sidebar mode via `group-data-[collapsible=icon]:hidden`.
- **Branding Audit:** All legacy FastAPI template branding (e.g., generic FastAPI SVGs, "FastAPI Template") has been fully removed.

---

### 3.2 Global Header Bar (`_layout.tsx`)
- **Structure:** Sticky top bar `h-14 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-xs px-4`.
- **Left Region:**
  - `SidebarTrigger` button (`-ml-1 text-muted-foreground hover:text-foreground`).
  - Vertical divider (`h-4 w-px bg-border mx-1 hidden sm:block`).
  - Live Russian date (`text-xs font-medium text-muted-foreground`, e.g., *"четверг, 27 августа"*).
- **Right Region:**
  - Operational shift badge: `Рабочая смена активна` with a pulsating emerald status dot (`size-1.5 rounded-full bg-emerald-500 animate-pulse`).

---

### 3.3 Application Sidebar (`AppSidebar.tsx`, `Main.tsx`, `User.tsx`)
- **Width & Collapse:** Responsive collapsible sidebar (`collapsible="icon"`).
- **Header:** Houses `Logo` with `variant="responsive"`.
- **Navigation Menu (`Main.tsx`):**
  - **Дашборд** (`/`): `Home` icon.
  - **Клиенты** (`/clients`): `Users` icon.
  - **Админ-панель** (`/admin`): `Shield` icon (rendered conditionally only for `currentUser.is_superuser`).
  - Active route matching using TanStack Router state with `SidebarMenuButton isActive={...}` styling.
- **Footer Region:**
  - `SidebarAppearance`: Theme switcher dropdown with `data-testid="theme-button"`, `data-testid="light-mode"`, `data-testid="dark-mode"`.
  - `User`: User profile popover with user initials avatar, full name, email, link to `Настройки профиля` (`/settings`), and `Выйти` logout trigger (`data-testid="user-menu"`).

---

### 3.4 Application Footer (`Footer.tsx`)
- **Layout:** `border-t py-4 px-6 bg-background/50 backdrop-blur-xs`.
- **Left Content:** `Atlas Meal CRM • Система управления доставкой рационов питания`.
- **Right Content:** Live server pulse dot (`size-2 rounded-full bg-emerald-500 animate-pulse`) + `Сервер активен • © 2026 Atlas`.

---

### 3.5 Authentication Suite (`AuthLayout.tsx`, `login.tsx`, `signup.tsx`, `recover-password.tsx`, `reset-password.tsx`)
- **Visual Grid:** Two-column split on large viewports (`grid min-h-svh lg:grid-cols-2`). Left column features soft tinted hero background with brand logo; right column contains the active auth form + theme switcher in top right + footer at bottom.
- **Strict Form Selectors & Preserved Test Contracts:**
  - `login.tsx`: `data-testid="email-input"`, `data-testid="password-input"`, button `"Войти"`, link `"Забыли пароль?"`, link `"Зарегистрироваться"`. Page title: `"Вход - Meal CRM"`.
  - `signup.tsx`: `data-testid="full-name-input"`, `data-testid="email-input"`, `data-testid="password-input"`, `data-testid="confirm-password-input"`, button `"Зарегистрироваться"`, link `"Войти"`. Page title: `"Регистрация - Meal CRM"`.
  - `recover-password.tsx`: `data-testid="email-input"`, button `"Продолжить"`, link `"Войти"`. Page title: `"Восстановление пароля - Meal CRM"`.
  - `reset-password.tsx`: `data-testid="new-password-input"`, `data-testid="confirm-password-input"`, button `"Сбросить пароль"`, link `"Войти"`. Page title: `"Сброс пароля - Meal CRM"`.

---

### 3.6 Operational Cockpit Dashboard (`_layout/index.tsx`)
- **Hero Operational Card (Delivery Priority #1):**
  - Card title: `"Доставки на сегодня"` in emerald accent container (`bg-emerald-500/5 border-emerald-500/30`).
  - Element: `<div data-testid="todays-deliveries-value" className="text-4xl font-extrabold tracking-tight tabular-nums">`.
  - Subtitle: *"Рационов питания к выдаче и доставке курьерами сегодня"*.
- **KPI Metrics Grid:**
  - **Активные клиенты:** Active vs total count, e.g., `48 из 120 всего`.
  - **Заканчивающиеся пакеты:** Amber warning card with badge `"до 7 дней"`, alerting manager to call for subscription renewal.
  - **Сумма долгов:** Coral/rose alert card showing total outstanding sum (`Intl.NumberFormat("ru-KG")`) and count of debtor clients.
- **Manager Action Center ("Требуют внимания"):**
  - Urgent list combining expiring packages (needs extension call) and unpaid debts (needs payment reminder) with one-click action buttons (`Продлить`, `Оплата`).
- **Kitchen & Meal Analytics:**
  - Distribution breakdown between **3X (3 приема пищи)** and **5X (5 приемов пищи)** with proportional progress bars.
  - Total calculated kitchen workload (`~{totalDailyMeals} готовых блюд в день`).

---

### 3.7 Client Directory & Filter Pills (`_layout/clients.tsx`)
- **Status Filter Pills (Target UX):**
  - Interactive filter chips with live counters replacing hidden select dropdown:
    `[ Все (120) ]`, `[ 🟢 Активные (48) ]`, `[ ⚠️ С долгом (36) ]`, `[ ⏸️ На паузе (8) ]`, `[ 🆕 Новые (12) ]`, `[ 🏁 Завершенные (16) ]`.
- **Client Row Composition:**
  - Avatar initials with color-coded status dot.
  - Client name + clickable phone number (`tel:` protocol).
  - Physical delivery address with `MapPin` icon.
  - Package mini-summary (e.g. `3X • ост. 8 дн.` or `Нет пакета`).
  - Outstanding debt badge (`5 000 сом`) or checkmark (`Оплачено`).
  - Action button: `"Открыть"` (`/clients/$clientId`).
- **Create Client Modal:**
  - Button text: `"Добавить клиента"` (preserves Playwright selector).
  - Dialog Title: `"Добавление клиента"`.
  - Field labels: `"Имя *"`, `"Телефон *"`, `"Email"`, `"Статус"`, `"Адрес"`, `"Заметки"`.
  - Buttons: `"Отмена"` and `"Сохранить"`.

---

### 3.8 Client Detail & 3-Zone Package Card (`clients.$clientId.tsx`, `PackageCard.tsx`)
- **Client Profile Header:**
  - Avatar with initials + full name + status badge.
  - Contact chips: Phone, Address, Email, Notes.
  - Quick debt indicator (`Текущий долг: X сом`).
  - Button: `"Редактировать клиента"` / `"Редактировать данные клиента"`.
- **3-Zone Package Card Architecture:**
  - **Zone 1: Header & Status:** Package meal type badge (`3X` / `5X`), status badge, debt badge.
  - **Zone 2: Delivery Progress Bar:** Visual progress representation of used vs remaining vs frozen vs extended days (e.g. `Использовано 14 из 22 дней (64%)`, `[████████░░░░]`).
  - **Zone 3: Prominent Financial Trio:**
    1. *Итого к оплате (Total obligation)*: `pkg.price + pkg.extension_added_price`
    2. *Оплачено (Paid amount)*: `pkg.paid_amount`
    3. *Остаток / Долг (Debt amount)*: `pkg.debt`
  - **One-Click Quick Actions:**
    - `+ Добавить доставку` (opens delivery modal with 1-day prior send date calculation).
    - `+ Зафиксировать оплату` / `+ Добавить оплату` (opens payment modal).
    - `❄️ Заморозить пакет` / `+ Добавить заморозку` (opens freeze modal).
    - `➕ Продлить пакет` / `+ Добавить продление` (opens extension modal with extra days & added price).
    - `Обновить статус` (active / paused / completed).
  - **Expandable Audit Tabs / History:**
    - Collapsible section with button label `"Подробнее"` (required by Playwright tests!) or toggleable tabs:
      - *История доставок*: Displays `"Дата питания: DD.MM.YYYY"` and `"Дата передачи / сборки (накануне): DD.MM.YYYY"`.
      - *История оплат*: Amounts and dates formatted in `ru-KG`.
      - *Заморозки*: Period and `"Заморожено дней: N"`.
      - *Продления*: `"+N дней (на DD.MM.YYYY)"` and `"Доплата: X сом"`.

---

### 3.9 Admin Panel & User Settings (`admin.tsx`, `settings.tsx`)
- **Admin Panel (`admin.tsx`):**
  - Heading: `"Пользователи"`, subtitle: `"Управление пользователями и правами доступа"`.
  - Button: `"Добавить пользователя"`.
  - Table columns: `ФИО`, `Email`, `Роль` (`Администратор` / `Пользователь`), `Статус` (`Активен` / `Неактивен`), Actions menu (`Редактировать`, `Удалить`).
  - **Localization Audit Note:** Action dialog buttons in `EditUser.tsx` and `DeleteUser.tsx` had English `"Save"`, `"Cancel"`, `"Delete"` which must be normalized to Russian `"Сохранить"`, `"Отменить"`, `"Удалить"` for Playwright test compatibility.
- **Settings Tabs (`settings.tsx`):**
  - Tab 1: `"Мой профиль"` (`UserInformation.tsx`) - Editable full name and email.
  - Tab 2: `"Пароль"` (`ChangePassword.tsx`) - Current password, new password, confirmation.
  - Tab 3: `"Опасная зона"` (`DeleteAccount.tsx` / `DeleteConfirmation.tsx`) - Irreversible account deletion.

---

## 4. Discovered Features & Edge Cases

### 4.1 Features Discovered Table
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Design Tokens | OKLCH Theme Variables | CSS custom properties in `:root` and `.dark` supporting dynamic theme switching | Theme name (`light`/`dark`) | Applied CSS colors across DOM | Defaults to fallback slate if var missing | `frontend/src/index.css` |
| 2 | Typography | Tabular Numerals | Enforces `font-variant-numeric: tabular-nums` on all currencies, dates, and counters | Numbers, KGS values | Monospaced numeric alignment | Rendered as proportional digits if omitted | `ui-ux-pro-max`, `web-design-guidelines` |
| 3 | Visual Identity | Responsive Logo | Adaptive brand icon + title collapsing in mini sidebar mode | `variant`: `full`, `icon`, `responsive` | SVG mark + typography | Fallback to icon only | `frontend/src/components/Common/Logo.tsx` |
| 4 | Operational Shell | Header Shift Status | Displays active operational shift indicator with pulsing emerald dot | System clock / session state | Badge: "Рабочая смена активна" | Hidden on small mobile | `frontend/src/routes/_layout.tsx` |
| 5 | Dashboard | Hero Today Deliveries | High-prominence cockpit card with testid contract | API count from `getTodaysDeliveryCount` | Large numeric display | 0 count fallback | `frontend/src/routes/_layout/index.tsx` |
| 6 | Dashboard | Attention Center | Aggregated action list of clients with expiring packages or debt | Active packages, debt > 0, end date <= 7 days | List of actionable client rows | Empty state congratulatory banner | `frontend/src/routes/_layout/index.tsx` |
| 7 | Dashboard | Meal Breakdown Analytics | Visual proportional distribution between 3X and 5X packages + kitchen portions | Active packages | Dual progress bars + total portions | 0% if no packages | `frontend/src/routes/_layout/index.tsx` |
| 8 | Client Directory | Status Filter Pills | Horizontal count chips for fast filtering by status | Status key click | Filtered table rows + live count badges | Fallback to "All" (120) | `implementation_plan.md`, `clients.tsx` |
| 9 | Client Detail | 3-Zone Package Layout | Zone 1 (Header/Status) -> Zone 2 (Delivery Progress) -> Zone 3 (Financials Trio) | Package detail object | Structured cards & progress bars | Empty state when no packages | `implementation_plan.md`, `PackageCard.tsx` |
| 10 | Package Ops | Automatic Delivery Send-Date | Auto-computes courier send date as exactly 1 day prior to meal date | Meal date (`scheduled_date`) | `sent_date = meal_date - 1 day` | Form validation error if difference != 1 day | `PackageCard.tsx`, `clients.spec.ts` |
| 11 | Package Ops | Total Financial Obligation | Sums base package price and all extension added prices | `price`, `extension_added_price` | `total_obligation = price + extension_added_price` | Negative prices disallowed (`min: 0`) | `PackageCard.tsx`, `clients.spec.ts` |
| 12 | Package Ops | Completed Package Locking | Prevents scheduling new deliveries once total days have been fully utilized | Delivery count vs effective days | Completes package status | API error toast rejection | `PackageCard.tsx`, `clients.spec.ts` |
| 13 | Access Control | Role-Gated Admin Route | Restricts `/admin` navigation to superusers only | `user.is_superuser` | Renders admin table or redirects to `/` | Redirects to `/` if unauthorized | `frontend/src/routes/_layout/admin.tsx` |
| 14 | Theme Provider | Persistence & Live Sync | Switches light/dark theme via `next-themes` and stores in `localStorage` | Theme selection click | HTML class `.dark`/`.light` change | Defaults to `dark` | `frontend/src/components/theme-provider.tsx` |

---

### 4.2 Edge Cases Matrix
| # | Feature | Input / Condition | Observed / Required Behavior |
|---|---|---|---|
| 1 | Delivery Date Semantics | Meal date entered as `2026-08-28` | Send date automatically fills as `2026-08-27`. If user manually alters send date to != 1 day before, form shows validation error *"Дата отправки должна быть ровно за 1 день до даты питания"*. |
| 2 | Package Completion | Package with 1 day total receives 1 delivery | Package status automatically transitions to `completed` (`Завершен`). Subsequent attempt to add another delivery is rejected by API. |
| 3 | Extension with Additional Price | Package base 11,000 сом + extension of 20 days for 19,000 сом | Total obligation updates to `30,000 сом`. If paid is 0, debt displays as `30,000 сом`. |
| 4 | Partial Payments | 3 payments of 3,000 сом on a 9,000 сом package | Debt progressively decreases: 9,000 → 6,000 → 3,000 → 0 сом. At 0 сом, debt badge disappears or shows neutral/success state. |
| 5 | Multiple Packages per Client | Client has both 3X and 5X active packages | Both packages render independently in package list; summary tile displays `"2"` packages. |
| 6 | Unused Imports in Build | `ArrowRight`, `Filter`, `MapPin`, `Phone`, `User`, `X` in `clients.tsx` | TypeScript compiler (`tsc -p tsconfig.build.json`) fails with `TS6133: declared but its value is never read`. Must be cleaned up. |
| 7 | Detail Expansion Button Text | Playwright test clicks button named `"Подробнее"` | In `PackageCard.tsx`, the expansion trigger must match `"Подробнее"` (or regex `/Подробнее|детали/i`) so automated tests pass reliably. |
| 8 | Mobile Viewport (375px) | Screen width <= 375px | Horizontal scroll on root body is prevented (`overflow-x-hidden`); tables wrap in scrollable container (`overflow-x-auto`). |

---

## 5. UI/UX Guidelines Compliance Checklist

### 5.1 Frontend Design (`frontend-design/SKILL.md`)
- [x] **Distinctive Visual Direction:** Full departure from generic FastAPI / developer grey cards. Fresh Nordic SaaS look with Forest Emerald / Jade primary and warm background surfaces.
- [x] **Grounding in Domain:** Centered entirely on meal delivery operations (3X/5X meal plans, kitchen daily portion calculations, delivery vs meal date semantics).
- [x] **Open with a Thesis:** Dashboard immediately presents today courier deliveries hero count (`data-testid="todays-deliveries-value"`) and urgent client renewals.
- [x] **Deliberate Typography:** High-contrast headings paired with `tabular-nums` for all financial figures and dates.
- [x] **Structural Information:** Progress bars encode real elapsed days vs total days; status badges include pulsating micro-dots.

### 5.2 UI/UX Pro Max (`ui-ux-pro-max/SKILL.md`)
- [x] **Non-Technical Business Copy:** Database terms translated to human business language (`Клиент`, `Пакет`, `Оплата`, `Доставка`, `Заморозка`, `Продление`, `День питания`, `Отправка курьером накануне`).
- [x] **Operational Cockpit:** Answers the 3-second manager morning questions without manual data collation.
- [x] **Clean Component Architecture:** Heavy modals and dialogs isolated into discrete components under `components/Clients/`, `components/Admin/`, `components/UserSettings/`.
- [x] **Progressive Disclosure:** High-level summary figures front and center; detailed chronological audit logs accessible via tabs/expandable drawers.
- [x] **Semantic Status Tokens:** Emerald (active), Amber (paused), Rose (debt), Slate (completed).

### 5.3 Web Interface Guidelines (`web-design-guidelines/SKILL.md`)
- [x] **Accessibility:** Icon-only buttons (theme toggle, sidebar trigger, ellipsis menus) have `aria-label` or `<span className="sr-only">`.
- [x] **Focus States:** Every interactive element has visible `:focus-visible` ring (`focus-visible:ring-ring focus-visible:ring-[3px]` or `focus-visible:ring-2`). No bare `outline-none`.
- [x] **Forms:** All inputs have explicit associated `<label>` (or `FormLabel`), appropriate HTML types (`email`, `date`, `number`), `spellCheck={false}` where needed, and disabled/loading state during mutations.
- [x] **Typography & Microcopy:** Standard typographic ellipsis used instead of three dots. Tabular numerals enforced on table columns and counters.
- [x] **Empty States:** Graceful empty states with actionable feedback on clients list, notes tab, delivery history, payment history, and attention center.

---

## 6. Recommendations & Implementation Action Items

1. **TypeScript Unused Import Cleanup:**
   - In `frontend/src/routes/_layout/clients.tsx`: Remove unused imports `ArrowRight`, `Filter`, `MapPin`, `Phone`, `User`, `X` (or utilize them in the new UI layout).
   - In `frontend/src/routes/_layout/index.tsx`: Remove unused imports `Calendar`, `TrendingUp`, `ReactNode`.
   - Re-verify with `npm run build` (`tsc -p tsconfig.build.json && vite build`).

2. **Playwright Selector Alignment:**
   - Ensure the package card detail toggle button text includes `"Подробнее"` so tests in `clients.spec.ts` find the button cleanly.
   - In `frontend/src/components/Admin/EditUser.tsx` and `DeleteUser.tsx`, ensure submit/cancel button texts are `"Сохранить"`, `"Отменить"`, `"Удалить"` (matching test expectations).
   - In `frontend/src/components/UserSettings/DeleteConfirmation.tsx`, align button texts to `"Удалить аккаунт"`, `"Отменить"`, `"Удалить"`.

3. **Client List Filter Pills Implementation:**
   - Replace the legacy select dropdown in `clients.tsx` with horizontal pill buttons featuring dynamic counts per status category (`Все`, `Активные`, `С долгом`, `На паузе`, `Новые`, `Завершенные`).

4. **Package Card 3-Zone Refinement:**
   - Structure `PackageCard.tsx` clearly into Header, Delivery Progress Bar, and Financial Trio (Total / Paid / Debt), with quick action buttons permanently visible.

---
*Report generated and validated by Specification Miner.*