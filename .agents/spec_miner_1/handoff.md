# UI/UX Specification Matrix & Handoff Report

**Project:** Atlas Meal CRM UI/UX Redesign (`ATLAS-002-meal-crm`)  
**Author:** Spec Miner 1  
**Target:** Parent Orchestrator & UI Implementation Agents  
**Timestamp:** 2026-08-28T00:41:00Z  

---

## 1. Observation

Direct observations from codebase inspection, design skills (`frontend-design`, `ui-ux-pro-max`, `web-design-guidelines`), approved design concept (`implementation_plan.md`), and all 7 Playwright test suites (`frontend/tests/`):

1. **Approved Design Concept (`implementation_plan.md`):**
   - Primary fresh emerald/jade palette: `oklch(0.54 0.15 156)` (light) / `oklch(0.66 0.15 156)` (dark).
   - Branding: "Atlas Meal CRM" with `UtensilsCrossed` icon (replaces all FastAPI branding).
   - Package Card: 3-zone layout (Zone 1: Header/Status, Zone 2: Delivery Progress Bar, Zone 3: Financial Summary 3-tile grid) with 1-click action buttons and expandable history.
   - Client List: Horizontal status filter pills with live counts (replacing hidden dropdown select).
   - Typography: `tabular-nums` for all financial, day counters, date, and metric values; `text-wrap: balance` for headings.
   - Currency: Kyrgyzstani Som (`KGS`, `сом`), locale `ru-KG`.

2. **Playwright Test Suite Inspection (`frontend/tests/`):**
   - 7 test files: `clients.spec.ts` (564 lines), `admin.spec.ts` (207 lines), `items.spec.ts` (15 lines), `login.spec.ts` (118 lines), `reset-password.spec.ts` (120 lines), `sign-up.spec.ts` (161 lines), `user-settings.spec.ts` (257 lines).
   - Hard selector dependencies identified:
     - Dashboard: `data-testid="todays-deliveries-value"`, text `"Добро пожаловать в панель управления CRM!"`, heading `"Сводка CRM"`, text `"Активные клиенты"`, text `"Доставки на сегодня"`.
     - Client List: button `"Добавить клиента"`, heading `"Клиенты"`, text `"Управление клиентской базой, статусами пакетов и заметками."`, link by client name, button `"Открыть"`.
     - Client Create Dialog: heading `"Добавление клиента"`, label `"Имя *"`, label `"Телефон *"`, button `"Сохранить"`, toast `"Клиент успешно добавлен"`.
     - Client Detail Header: heading by client name, client phone text, tabs `"Пакеты питания"` and `"Заметки"`, button `"Редактировать клиента"` or `"Редактировать"`.
     - Package Card: text `"3X пакет"` / `"5X пакет"` (or containing `"3X пакет"` / `"5X пакет"`), button `"Подробнее"` (toggles details), text `"Заморожено дней: 2"`, text `"+5 дней (на"`, text `"Доплата: 1 900"`, text matching `/Долг.*7.?000/` and `/Долг.*0/`, text `/Общая стоимость/` and `"30,000"`, status badge text `"На паузе"`, `"Завершен"`, `"Активен"`.
     - Package Actions: buttons `"Добавить пакет"`, `"Сохранить пакет"`, `"Добавить доставку"`, `"Сохранить доставку"`, `"Добавить заморозку"`, `"Сохранить заморозку"`, `"Добавить продление"`, `"Сохранить продление"`, `"Добавить оплату"` / `"Зафиксировать оплату"`, `"Сохранить оплату"`, `"Обновить статус"` / `"Изменить статус"`, `"Сохранить статус"`.
     - Add Package Dialog Labels: label `"Кол-во дней"` (or `"Всего дней"`), label `"Цена"` (or `"Стоимость"`), label `"Дата начала"`.
     - Delivery Form Labels: label `"Дата питания"`, label `"Дата передачи / сборки"` (auto-calculates to scheduled_date - 1 day).
     - Freeze Form Labels: label `"Дата начала"`, label `"Дата окончания"`.
     - Extension Form Labels: label `"Доп. дни"`, label `"Доплата"`, label `"Дата"`.
     - Payment Form Labels: label `"Сумма"`, label `"Дата"`.
     - Auth & Settings: `data-testid` attributes: `email-input`, `password-input`, `full-name-input`, `confirm-password-input`, `new-password-input`, `current-password-input`, `user-menu`, `theme-button`, `light-mode`, `dark-mode`.

3. **Design Skills Requirements:**
   - `frontend-design`: Purposeful aesthetic, no generic starter box grids, semantic visual language.
   - `ui-ux-pro-max`: Semantic color mapping (emerald=active, amber=paused, rose=debt, slate=completed), manager cockpit layout, 3-zone package card.
   - `web-design-guidelines`: Visible focus rings (`focus-visible:ring-2`), aria-labels on icon buttons, form labels associated with inputs (`htmlFor`), WCAG AA contrast (>= 4.5:1), responsive layout without horizontal scroll at 375px.

---

## 2. Logic Chain

1. **Test Compatibility Guarantee:** Playwright tests query DOM nodes via specific text matchers (`getByRole`, `getByLabel`, `getByText`, `getByTestId`). If a redesign alters these strings (e.g., changing "Подробнее" to "Показать историю" or changing "Добавить клиента" to "Создать клиента" or changing "Кол-во дней" to "Срок"), existing automated tests will fail. Therefore, all functional test selector contracts must be cataloged and strictly preserved.
2. **Dual-Label & Text Compatibility Strategy:** Where UX terminology can be enhanced for manager clarity (e.g. "Пакет 3X" vs test checking "3X пакет"), both representations can be cleanly accommodated (e.g., rendering `"Пакет 3X • 3X пакет"` or retaining subtitle/badge `"3X пакет"` in card header, and retaining `"Подробнее"` on the collapsible button).
3. **Number Formatting Consistency:** Financial values and counters must render in `tabular-nums` with Kyrgyzstani Som (`сом` / `KGS`). In regex test assertions (such as `/Долг.*7.?000/` or `"30,000"` / `"1 900"`), formatted numbers must align with expected localized spacing or commas.
4. **Accessible Semantic Hierarchy:** Using real semantic elements (`<button>`, `<a>`, `<label>`, `<Table>`) ensures screen reader support and automatic Playwright role matching without brittle CSS selector hacks.

---

## 3. Caveats

1. The backend API schema is completely frozen; all calculations (days remaining, total debt, total obligation) must be calculated client-side from existing SQLModel DTO fields (`total_days`, `extension_days`, `days_used`, `days_remaining`, `price`, `extension_added_price`, `paid_amount`, `debt`, `freeze_days`).
2. Playwright parallel runner in resource-constrained environments may experience occasional timeouts, but zero failures should occur due to selector mismatches or missing labels.

---

## 4. Conclusion

The specification matrix below provides the exact blueprint for executing R1 (Dashboard), R2 (Client List), and R3 (Client Detail & Package Card). Implementing agents can follow these exact tokens, classes, strings, and markup patterns to achieve a high-end UI while maintaining 100% Playwright test pass rates.

---

## 5. Verification Method

To independently verify specification compliance:
1. **Type & Build Verification:** `npm run build` in `frontend/` (zero type errors, zero bundling errors).
2. **E2E Test Verification:** With backend running (`docker compose up -d db mailpit backend`), run `npx playwright test` in `frontend/`.
3. **Visual & Responsive Verification:** Inspect mobile viewport (375px) in browser dev tools for no horizontal overflow.

---

# Comprehensive Specification Matrix

## 1. Semantic Status Color Tokens & Tailwind Classes

| Status Key | Russian Label | Semantic Meaning | Tailwind Light Classes | Tailwind Dark Classes | Dot Indicator Class |
|---|---|---|---|---|---|
| `active` | Активен | Active meal delivery in progress | `bg-emerald-50 text-emerald-700 border-emerald-200` | `bg-emerald-950/30 text-emerald-300 border-emerald-800/40` | `bg-emerald-500` (pulse option) |
| `paused` | На паузе | Delivery frozen / on hold | `bg-amber-50 text-amber-700 border-amber-200` | `bg-amber-950/30 text-amber-300 border-amber-800/40` | `bg-amber-500` |
| `debt` | С долгом / Долг | Unpaid invoice, requires manager call | `bg-rose-50 text-rose-700 border-rose-200` | `bg-rose-950/30 text-rose-300 border-rose-800/40` | `bg-rose-500` |
| `completed` | Завершен | Package or contract completed | `bg-slate-100 text-slate-700 border-slate-200` | `bg-slate-800/40 text-slate-300 border-slate-700` | `bg-slate-400` |
| `new` | Новый | Fresh lead / new client | `bg-sky-50 text-sky-700 border-sky-200` | `bg-sky-950/30 text-sky-300 border-sky-800/40` | `bg-sky-500` |
| `archived` | Архив / Архивирован | Archived client record | `bg-zinc-100 text-zinc-600 border-zinc-200` | `bg-zinc-800/30 text-zinc-400 border-zinc-700` | `bg-zinc-500` |

### CSS Variables Reference (`index.css`):
- `--primary`: `oklch(0.54 0.15 156)` (Light) / `oklch(0.66 0.15 156)` (Dark)
- `--status-active`: `oklch(0.54 0.15 156)`
- `--status-paused`: `oklch(0.68 0.16 80)`
- `--status-debt`: `oklch(0.58 0.22 25)`
- `--status-completed`: `oklch(0.52 0.02 240)`

---

## 2. Preserved Playwright Test Selectors & Strings Inventory

### A. Critical `data-testid` Attributes
| Target Element | `data-testid` | File & Context |
|---|---|---|
| Dashboard Today's Deliveries Counter | `todays-deliveries-value` | `frontend/src/routes/_layout/index.tsx` |
| Login / Signup / Recovery Email Input | `email-input` | `routes/login.tsx`, `routes/signup.tsx`, `routes/recover-password.tsx` |
| Login / Signup Password Input | `password-input` | `routes/login.tsx`, `routes/signup.tsx` |
| Signup Full Name Input | `full-name-input` | `routes/signup.tsx` |
| Signup Confirm Password Input | `confirm-password-input` | `routes/signup.tsx` |
| Password Reset New Password Input | `new-password-input` | `routes/reset-password.tsx` |
| Password Reset Confirm Input | `confirm-password-input` | `routes/reset-password.tsx` |
| Settings Current Password Input | `current-password-input` | `components/UserSettings/ChangePassword.tsx` |
| Settings New Password Input | `new-password-input` | `components/UserSettings/ChangePassword.tsx` |
| Settings Confirm Password Input | `confirm-password-input` | `components/UserSettings/ChangePassword.tsx` |
| Sidebar User Menu Trigger | `user-menu` | `components/Sidebar/User.tsx` |
| Appearance Mode Trigger | `theme-button` | `components/Common/Appearance.tsx` |
| Light Theme Option | `light-mode` | `components/Common/Appearance.tsx` |
| Dark Theme Option | `dark-mode` | `components/Common/Appearance.tsx` |
| Error Component Container | `error-component` | `components/Common/ErrorComponent.tsx` |
| Not Found Container | `not-found` | `components/Common/NotFound.tsx` |

### B. Action Buttons (Preserved Exact Texts)
| Exact Button Text | Action / Trigger | Test Assertion |
|---|---|---|
| `"Добавить клиента"` | Opens `AddClientDialog` | `getByRole("button", { name: "Добавить клиента" })` |
| `"Сохранить"` | Generic dialog submit | `getByRole("button", { name: "Сохранить" })` |
| `"Отмена"` / `"Отменить"` | Generic dialog cancel | `getByRole("button", { name: "Отменить" })` |
| `"Добавить пакет"` | Opens `AddPackageDialog` | `getByRole("button", { name: "Добавить пакет" })` |
| `"Сохранить пакет"` | Submits new package | `getByRole("button", { name: "Сохранить пакет" })` |
| `"Подробнее"` | Expands package history & details | `getByRole("button", { name: "Подробнее" })` |
| `"Добавить доставку"` | Opens delivery dialog | `getByRole("button", { name: "Добавить доставку" })` |
| `"Сохранить доставку"` | Submits delivery | `getByRole("button", { name: "Сохранить доставку" })` |
| `"Добавить заморозку"` / `"Заморозить пакет"` | Opens freeze dialog | `getByRole("button", { name: "Добавить заморозку" })` |
| `"Сохранить заморозку"` | Submits freeze | `getByRole("button", { name: "Сохранить заморозку" })` |
| `"Добавить продление"` / `"Продлить пакет"` | Opens extension dialog | `getByRole("button", { name: "Добавить продление" })` |
| `"Сохранить продление"` | Submits extension | `getByRole("button", { name: "Сохранить продление" })` |
| `"Добавить оплату"` / `"Зафиксировать оплату"` | Opens payment dialog | `getByRole("button", { name: "Добавить оплату" })` |
| `"Сохранить оплату"` | Submits payment | `getByRole("button", { name: "Сохранить оплату" })` |
| `"Обновить статус"` / `"Изменить статус"` | Opens package status dialog | `getByRole("button", { name: "Обновить статус" })` |
| `"Сохранить статус"` | Submits package status | `getByRole("button", { name: "Сохранить статус" })` |
| `"Сохранить заметку"` | Submits client note | `getByRole("button", { name: "Сохранить заметку" })` |
| `"Редактировать"` / `"Редактировать клиента"` | Opens edit client dialog | `getByRole("button", { name: "Редактировать" })` |
| `"Открыть"` | Table row link to detail | `getByRole("link", { name: "Открыть" })` |
| `"Войти"` | Auth login button | `getByRole("button", { name: "Войти" })` |
| `"Зарегистрироваться"` | Auth signup button | `getByRole("button", { name: "Зарегистрироваться" })` |
| `"Сбросить пароль"` | Password reset button | `getByRole("button", { name: "Сбросить пароль" })` |
| `"Обновить пароль"` | User settings change password | `getByRole("button", { name: "Обновить пароль" })` |
| `"Добавить пользователя"` | Admin create user | `getByRole("button", { name: "Добавить пользователя" })` |
| `"Удалить"` | Delete confirmation | `getByRole("button", { name: "Удалить" })` |

### C. Form Labels & Placeholders
| Form Context | Label / Placeholder | Exact String in Test |
|---|---|---|
| Client Create / Edit | Label | `"Имя *"` |
| Client Create / Edit | Label | `"Телефон *"` |
| Client Create / Edit | Label | `"Email"` |
| Client Create / Edit | Label | `"Адрес"` |
| Client Create / Edit | Label | `"Статус"` |
| Client Create / Edit | Label | `"Заметки"` |
| Package Create | Label | `"Тип пакета"` |
| Package Create | Label | `"Кол-во дней"` (or `<FormLabel>Кол-во дней</FormLabel>`) |
| Package Create | Label | `"Цена"` (or `<FormLabel>Цена</FormLabel>`) |
| Package Create | Label | `"Дата начала"` |
| Delivery Dialog | Label | `"Дата питания"` |
| Delivery Dialog | Label | `"Дата передачи / сборки"` |
| Freeze Dialog | Label | `"Дата начала"` |
| Freeze Dialog | Label | `"Дата окончания"` |
| Freeze Dialog | Label | `"Причина"` |
| Extension Dialog | Label | `"Доп. дни"` |
| Extension Dialog | Label | `"Доплата"` |
| Extension Dialog | Label | `"Дата"` |
| Payment Dialog | Label | `"Сумма"` |
| Payment Dialog | Label | `"Дата"` |
| Payment Dialog | Label | `"Комментарий"` |
| Note Form | Label | `"Новая заметка"` |
| Admin User Create | Placeholder | `"Email"`, `"ФИО"`, `"Пароль"` |
| Admin User Checkboxes | Label | `"Администратор?"`, `"Активен?"` |

### D. Toast Notifications & Visible Texts Checked by Tests
| Operation | Expected Toast / Text |
|---|---|
| Client Added | `"Клиент успешно добавлен"` |
| Client Updated | `"Данные клиента успешно обновлены"` |
| Package Added | `"Пакет успешно добавлен"` |
| Package Card Heading | `"3X пакет"` / `"5X пакет"` (must be visible on card) |
| Delivery Added | `"Доставка успешно добавлена"` |
| Delivery Item Render | `"Дата питания: [Date]"` |
| Freeze Added | `"Заморозка успешно добавлена"` |
| Freeze Days Summary | `"Заморожено дней: 2"` (or `"Заморожено дней: N"`) |
| Extension Added | `"Продление успешно добавлено"` |
| Extension Summary Text | `"+5 дней (на"` and `"Доплата: 1 900"` |
| Payment Added | `"Оплата успешно добавлена"` |
| Status Updated | `"Статус пакета успешно обновлен"` |
| Note Added | `"Заметка успешно добавлена"` |
| User Created | `"Пользователь успешно создан"` |
| User Updated | `"Пользователь успешно обновлен"` |
| User Deleted | `"Пользователь успешно удален"` |
| Password Updated | `"Пароль успешно обновлен"` |
| Dashboard Welcome | `"Добро пожаловать в панель управления CRM!"` |
| Dashboard Heading | `"Сводка CRM"` |
| Dashboard Metric | `"Активные клиенты"`, `"Доставки на сегодня"` |
| Package Obligation | `"Общая стоимость"` and `"30,000"` |
| Package Debt | `/Долг.*7.?000/`, `/Долг.*0/` |

---

## 3. Number & Currency Formatting Rules

1. **Currency Formulation:**
   - Standard: Kyrgyzstani Som (`KGS` / `сом`).
   - Implementation:
     ```typescript
     export const formatCurrency = (amount: number): string => {
       return new Intl.NumberFormat("ru-KG", {
         style: "currency",
         currency: "KGS",
         maximumFractionDigits: 0,
       }).format(amount)
     }
     ```
   - For tests expecting `30,000` or `1 900` or `7 000`, ensure clean tabular numeric rendering without NaN or floating fractions.

2. **Tabular Numerals (`tabular-nums`):**
   - Apply class `tabular-nums` (or CSS `font-variant-numeric: tabular-nums`) to:
     - Dashboard hero delivery counter (`data-testid="todays-deliveries-value"`)
     - All KPI cards, statistics, and percentages
     - Package Card Zone 2 progress labels ("Использовано X из Y дней (Z%)")
     - Package Card Zone 3 financial summary amounts ("Итого к оплате", "Оплачено", "Долг")
     - Table debt columns, phone numbers, and dates

3. **Date Formatting Semantics:**
   - Client display date: `new Date(value).toLocaleDateString("ru-RU", { year: "numeric", month: "short", day: "numeric" })`
   - Detailed timestamp: `new Date(value).toLocaleString("ru-KG", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })`
   - Delivery logic:
     - "День питания клиента" (`scheduled_date`)
     - "Дата отправки курьером (за 1 день до еды)" (`sent_date = scheduled_date - 1 day`)

---

## 4. Accessibility Requirements (Web Design Guidelines)

1. **Focus States:**
   - All interactive components (buttons, links, inputs, selects, tabs) must have visible focus rings: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden`.
   - Never suppress outline with `outline-none` unless accompanied by `focus-visible:ring-*`.
2. **Icon-Only Buttons:**
   - Every icon button MUST have an explicit `aria-label` (e.g. `aria-label="Редактировать клиента"`, `aria-label="Позвонить клиенту"`).
   - Decorative icons must use `aria-hidden="true"`.
3. **Form & Dialog Accessibility:**
   - All form controls require `<FormLabel>` with associated `htmlFor` or direct input wrapping.
   - Dialogs must include `<DialogTitle>` and `<DialogDescription>` inside `<DialogHeader>` for screen readers.
   - Escape key dismisses modals; keyboard `Tab` traps focus inside modal.
4. **Color Contrast:**
   - All text and badge tokens must achieve WCAG AA contrast ratio of at least 4.5:1 against their backgrounds in both light and dark themes.
5. **Mobile & Viewport:**
   - Zero horizontal overflow on 375px mobile viewport. Tables must wrap in `<div className="overflow-x-auto">` or employ responsive card views.

---

## 5. Detailed Implementation Checklist for R1, R2, and R3

### R1. Dashboard Redesign Checklist (`routes/_layout/index.tsx`)
- [ ] Header banner with manager greeting ("Привет, {Name} 👋") and subtitle "Добро пожаловать в панель управления CRM!".
- [ ] Section heading "Сводка CRM".
- [ ] **Hero KPI Card:** "Доставки на сегодня" with prominent emerald accent border/background and preserved `data-testid="todays-deliveries-value"`.
- [ ] **Active Clients Card:** "Активные клиенты" displaying active count vs total base.
- [ ] **Expiring Packages Card:** "Заканчивающиеся пакеты" with warning badge (до 7 дней).
- [ ] **Total Debt Card:** "Сумма долгов" in rose palette with debtor count.
- [ ] **Action Center ("Требуют внимания"):** Top urgent clients (debts and expiring packages) with direct 1-click CTA buttons linking to client detail.
- [ ] **Meal Breakdown Widget:** Visual progress bars for 3X vs 5X packages with daily kitchen meal volume estimate.
- [ ] All numeric figures styled with `tabular-nums`.

### R2. Client List Redesign Checklist (`routes/_layout/clients.tsx`)
- [ ] **Filter Pills:** Replace `<Select>` dropdown with horizontal filter pills showing live counts:
  - `Все (N)`
  - `🟢 Активные (N)`
  - `⚠️ С долгом (N)`
  - `⏸️ На паузе (N)`
  - `🆕 Новые (N)`
  - `🏁 Завершенные (N)`
  - `📦 Архивированные (N)`
- [ ] **Search Input:** Filter by name, phone, address with Search icon.
- [ ] **Client Table Rows:**
  - Avatar circle with initials + colored status dot (`bg-emerald-500`, `bg-amber-500`, `bg-rose-500`, etc.).
  - Clickable client name link to `/clients/$clientId`.
  - Phone number with `Phone` icon (clickable `tel:`).
  - Address with `MapPin` icon (or "—" if empty).
  - Semantic status badge.
  - Formatted creation date.
  - Primary "Открыть" action button/link.
- [ ] **Empty State:** Friendly graphic/message when no clients match filters.
- [ ] **Add Client Dialog:** Preserved button "Добавить клиента", dialog title "Добавление клиента", form labels "Имя *", "Телефон *", submit "Сохранить", toast "Клиент успешно добавлен".

### R3. Client Detail & Package Card Redesign Checklist (`routes/_layout/clients.$clientId.tsx` & `components/Clients/PackageCard.tsx`)
- [ ] **Client Profile Header:**
  - Large avatar circle with client initials and status color.
  - Large client name (heading).
  - Semantic status badge.
  - Debt warning badge if total debt > 0.
  - Contact metadata with icons (Phone, MapPin, Email).
  - "Редактировать клиента" button triggering `EditClientDialog`.
  - Back navigation link.
  - Tabs: "Пакеты питания" and "Заметки менеджера".
- [ ] **Package Card 3-Zone Redesign (`PackageCard.tsx`):**
  - **Zone 1 — Header:**
    - Package title: `"Пакет 3X"` / `"Пакет 5X"` with visible `"3X пакет"` / `"5X пакет"` indicator for Playwright test matchers.
    - Date range (`start_date` → `end_date`).
    - Semantic status badge ("Активен", "На паузе", "Завершен").
    - Debt badge if `debt > 0` (`"Долг: 7 000 сом"`).
  - **Zone 2 — Delivery Progress:**
    - Visual progress bar: percentage of `days_used` / (`total_days` + `extension_days`).
    - Progress text: `"Использовано X из Y дней (Z%)"`.
    - Informational pills/badges: `"Базовых дней: N"`, `"Продлено: +N"`, `"Заморожено дней: N"` (satisfying test `"Заморожено дней: 2"`).
  - **Zone 3 — Financial Summary:**
    - 3 prominent figures side by side:
      1. `"Итого к оплате"` / `"Общая стоимость"` (`price + extension_added_price`)
      2. `"Оплачено"` (`paid_amount`)
      3. `"Остаток / Долг"` (`debt`, styled in rose if > 0)
  - **1-Click Action Buttons Row (Always Visible):**
    - `"Добавить доставку"`
    - `"Зафиксировать оплату"` / `"Добавить оплату"`
    - `"Заморозить пакет"` / `"Добавить заморозку"`
    - `"Продлить пакет"` / `"Добавить продление"`
    - `"Обновить статус"` / `"Изменить статус"`
  - **Expandable History Section:**
    - Toggle button `"Подробнее"` (toggles expand/collapse).
    - Subsections:
      - История доставок (displaying `"Дата питания: [Date]"` and `"Дата отправки / списания"`)
      - История оплат
      - Заморозки
      - Продления (displaying `"+N дней (на..."` and `"Доплата: N"`)
- [ ] **Add Package Dialog:**
  - Form labels: `"Тип пакета"`, `"Кол-во дней"`, `"Цена"`, `"Дата начала"`.
  - Button text: `"Сохранить пакет"`.
  - Toast: `"Пакет успешно добавлен"`.

---

## Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Global Shell | Emerald Design Tokens | OkLCH emerald primary palette with dark mode support | CSS variables | Styled UI surfaces | Falls back to system dark/light | `index.css`, `SKILL.md` |
| 2 | Dashboard | Hero Delivery Card | Prominent card for today's deliveries | Delivery count | Rendered count with `todays-deliveries-value` | Zero display if null | `index.tsx`, `clients.spec.ts` |
| 3 | Dashboard | Manager Action Center | Action list for clients needing calls | Debts & expiring packages | Client list with direct CTA links | "All clear" friendly banner | `index.tsx`, `implementation_plan.md` |
| 4 | Client List | Status Filter Pills | Horizontal buttons with live client counts | Status category selection | Filtered client table | Empty state banner | `clients.tsx`, `ORIGINAL_REQUEST.md` |
| 5 | Client List | Rich Table Rows | Micro-card table rows with avatar, phone, address | Client records | Enhanced table view | Placeholder "—" for empty fields | `clients.tsx`, `SKILL.md` |
| 6 | Client Detail | Profile Header | Customer summary banner with contact details & debt | Client DTO | Profile header card | "Адрес не указан" fallback | `clients.$clientId.tsx` |
| 7 | Package UX | 3-Zone Card | Zone 1 (Header), Zone 2 (Progress bar), Zone 3 (Financials) | Package DTO | Structured 3-zone card | Red alert if debt > 0 | `PackageCard.tsx`, `implementation_plan.md` |
| 8 | Package UX | 1-Click Action Row | Direct buttons for delivery, payment, freeze, extend | Click event | Opens respective modal | Disables on pending mutation | `PackageCard.tsx` |
| 9 | Package UX | Expandable History | Detailed breakdown of deliveries, freezes, extensions | Expand button ("Подробнее") | History lists | "Записей пока нет" fallback | `PackageCard.tsx`, `clients.spec.ts` |
| 10 | Delivery Logic | Auto-Shift Send Date | Sent date automatically sets to `meal_date - 1 day` | Meal date input | Send date populated | Validation error if diff != 1 day | `PackageCard.tsx`, `clients.spec.ts` |
| 11 | Package Creation | Dual Type Support | 3X and 5X meal plans with day/price configuration | Meal type, days, price, start date | Created package | Form validation errors | `AddPackageDialog.tsx`, `clients.spec.ts` |
| 12 | User Admin | Admin Management | User CRUD with superuser and activation flags | User form fields | User table rows | Form validation errors | `admin.spec.ts` |
| 13 | Appearance | Theme Switcher | Light/Dark theme toggle preserved across sessions | Theme selection | Applied html class `dark`/`light` | Preserved in storage | `Appearance.tsx`, `user-settings.spec.ts` |

---

## Edge Cases
| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Package Delivery | Adding delivery to Completed package | API rejects request; dialog remains open without success toast |
| 2 | Delivery Date Validation | Meal date and send date on same day | Form validation error: "Дата отправки должна быть ровно за 1 день до даты питания" |
| 3 | Package Extension | Extension with 0 added price vs > 0 price | Correctly calculates total obligation (`price + extension_added_price`) and debt |
| 4 | Freeze Calculation | Start date = End date (1 day) vs multi-day | Correctly computes frozen days as `(end - start) + 1` |
| 5 | Search Filtering | Search query with mixed case, spaces, phone substrings | Matches across client name, phone, and address case-insensitively |
| 6 | Empty Client List | Filter resulting in zero records | Shows full-width empty state message with no broken table borders |
| 7 | Zero Debt | Client completes all partial payments | Debt badge renders 0 or switches to neutral/success state |
| 8 | Responsive Viewport | Narrow screen (375px) | Layout stacks vertically without horizontal body scrollbar |
