# Handoff Report: Requirement R2 (Client Detail Page) & Requirement R3 (Package Card 3-Zone Redesign)

**Agent**: Explorer 2  
**Working Directory**: `F:\ATLAS\ATLAS-002-meal-crm\.agents\explorer_2`  
**Target Scope**:
- `frontend/src/routes/_layout/clients.$clientId.tsx` (R2: Client Detail Page)
- `frontend/src/components/Clients/PackageCard.tsx` (R3: Package Card 3-Zone Redesign)
- Related dialogs and helper components in `frontend/src/components/Clients/`
- UI design system alignment with emerald palette, tabular numbers, semantic statuses, and Playwright E2E compatibility.

---

## 1. Observation

### 1.1 Existing Codebase & UI State
1. **Client Detail Page (`frontend/src/routes/_layout/clients.$clientId.tsx`)**:
   - Lines 93–140: Uses a single top `Card` with `h1` name, basic `Badge`, and 6 flat `InfoTile` blocks (`Добавлен`, `Обновлен`, `Всего пакетов`, `Текущий долг`, `Заметки о клиенте`, `Доп. контакт`).
   - Missing back-navigation link to return to the clients list.
   - Missing avatar with client initials and semantic status color indicator.
   - Missing phone `tel:` clickability and mail `mailto:` link.
   - Tabs (lines 142–207) separate `Пакеты питания` and `Заметки менеджера`, but lack live item count badges on tab triggers.
   - Uses `currencyFormatter` with `ru-KG` and `KGS`, which is correct for Kyrgyzstani Som.

2. **Package Card (`frontend/src/components/Clients/PackageCard.tsx`)**:
   - Lines 164–222: Package Card currently displays a flat 4-column grid of 14 `SummaryLine` tiles (`Всего дней`, `С продлением`, `Использовано`, `Осталось`, `Базовая цена`, `Цена продлений`, `Итого к оплате`, `Оплачено`, `Заморозки (дней)`, `Продления (дней)`, `Начало`, `Конец`, `Всего доставок`, `Текущий долг`).
   - Lines 214–220: Action dialogs (`AddPaymentDialog`, `AddDeliveryDialog`, `AddFreezeDialog`, `AddExtensionDialog`) are **hidden inside the collapsed section** under `isExpanded ? (...) : null`. Only `UpdatePackageStatusDialog` and the expand button (`Показать детали`) are directly visible.
   - No visual progress bar for delivery progress (`days_used / (total_days + extension_days)`).
   - Financial figures are scattered across 4 individual small summary tiles rather than grouped into a 3-pillar financial summary (Total, Paid, Debt).
   - Delivery history (lines 255–275) lists scheduled and sent dates without highlighting the delivery cycle rule: *"Дата отправки курьером (за 1 день до еды)"*.

3. **Dialogs & Helpers in `frontend/src/components/Clients/`**:
   - `EditClientDialog.tsx` (272 lines): Fully functional dialog modifying `name`, `phone`, `address`, `email`, `status`, `notes`.
   - `AddPackageDialog.tsx` (224 lines): Creates 3X or 5X packages. Currently uses label `Всего дней` and `Стоимость`, whereas Playwright test `frontend/tests/clients.spec.ts` line 124 & 125 checks `getByLabel("Кол-во дней")` and `getByLabel("Цена")`.
   - `AddNoteForm.tsx` (94 lines): Adds client notes. Currently uses label `Добавить заметку`, whereas Playwright test line 519 checks `getByLabel("Новая заметка")`.
   - Inside `PackageCard.tsx`:
     - `AddDeliveryDialog`: Uses label `Дата отправки / списания`, whereas Playwright test line 171 checks `getByLabel("Дата передачи / сборки")`.
     - `AddFreezeDialog`: Playwright test line 205 checks `getByRole("button", { name: "Добавить заморозку" })` and line 212 checks `getByText("Заморожено дней: 2")`.
     - `AddExtensionDialog`: Playwright test line 237 checks `getByRole("button", { name: "Добавить продление" })` and line 367 checks `getByText(/Общая стоимость/)`.
     - `AddPaymentDialog`: Playwright test line 271 checks `getByRole("button", { name: "Добавить оплату" })`.
     - `UpdatePackageStatusDialog`: Toast message in `PackageCard.tsx` line 897 is `"Статус пакета успешно изменен"`, whereas Playwright test line 334 checks `getByText("Статус пакета успешно обновлен")`.

4. **Design System Tokens & Build Status**:
   - `index.css`: Defines emerald primary `oklch(0.54 0.15 156)`, semantic statuses (`--status-active`, `--status-paused`, `--status-debt`, `--status-completed`), `.tabular-nums`, and dark mode overrides.
   - `npm run build` currently succeeds with 0 errors in ~1.3s.

---

## 2. Logic Chain

### 2.1 Requirement R2: Client Detail Page Design Blueprint

```
+-----------------------------------------------------------------------------------------------+
|  <-- Назад к списку клиентов                                                                  |
+-----------------------------------------------------------------------------------------------+
|  [AVATAR: ИК]  Иван Кузнецов   [Активен (Emerald)]  [Долг: 7 000 сом (Rose)]  [Редактировать] |
|                Phone: +996 555 123 456  |  MapPin: Бишкек, ул. Киевская 10  |  Email: ivan@...|
|  -------------------------------------------------------------------------------------------  |
|  [Всего пакетов: 2]   [Активных: 1]   [Текущий долг: 7 000 сом]   [Клиент с: 12 авг 2026]     |
+-----------------------------------------------------------------------------------------------+
|  [ Пакеты питания (2) ]   [ Заметки менеджера (3) ]                                           |
|  ===========================================================================================  |
|  + Пакеты: Заголовок + Описание + [ + Добавить пакет ]                                        |
|  + PackageCard 1 (3-Zone Card)                                                                |
|  + PackageCard 2 (3-Zone Card)                                                                |
+-----------------------------------------------------------------------------------------------+
```

#### Detailed Element Specifications for `clients.$clientId.tsx`:
1. **Back Navigation**:
   - Prominent link: `<Link to="/clients" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="mr-1.5 size-4" /> Назад к списку клиентов</Link>`.
2. **Profile Header Card**:
   - **Avatar with Initials**:
     - Extract initials from `client.name` (`client.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)`).
     - Circular avatar (`size-14 md:size-16 rounded-full font-bold text-lg`).
     - Background/border colored based on `client.status`:
       - `active`: emerald background (`bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30`)
       - `paused`: amber background (`bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30`)
       - `debt`: rose background (`bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30`)
       - `new`: blue background (`bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30`)
       - `completed`/`archived`: slate background (`bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30`)
     - Status dot on bottom-right of avatar (`size-3.5 rounded-full border-2 border-card`).
   - **Name & Badges**:
     - `h1` with `client.name` (`text-2xl md:text-3xl font-extrabold tracking-tight`).
     - Semantic status badge (`clientStatusLabels[client.status]`).
     - Quick debt badge if `totalDebt > 0`: `<Badge variant="destructive" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 font-semibold"><AlertTriangle className="size-3.5 mr-1" /> Долг: {currencyFormatter.format(totalDebt)}</Badge>`.
   - **Contact Row**:
     - Phone: clickable `<a href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 hover:underline text-foreground/90"><Phone className="size-4 text-emerald-600 dark:text-emerald-400" /> {client.phone}</a>`.
     - Address: `<span className="inline-flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-4 text-emerald-600 dark:text-emerald-400" /> {client.address || "Адрес не указан"}</span>`.
     - Email: `<span className="inline-flex items-center gap-1.5 text-muted-foreground"><Mail className="size-4 text-emerald-600 dark:text-emerald-400" /> {client.email ? <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a> : "Email не указан"}</span>`.
     - Extra contact: if `client.contact_extra`, display with `UserCheck` or `MessageSquare` icon.
   - **Action**:
     - `<EditClientDialog client={client} />` with `Pencil` icon.
   - **Quick Stat Metrics Grid** (in card content):
     - `Всего пакетов`: `{client.packages.length}`
     - `Активных рационов`: `{client.packages.filter(p => p.status === 'active').length}`
     - `Текущий долг`: `{currencyFormatter.format(totalDebt)}` (`tabular-nums`, highlighted in rose if `totalDebt > 0`)
     - `Дата регистрации`: `{formatDate(client.created_at)}`
3. **Tabbed Content**:
   - `<Tabs defaultValue="packages">`
   - `<TabsList>`:
     - `<TabsTrigger value="packages">` `Пакеты питания` + `<Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{client.packages.length}</Badge>`
     - `<TabsTrigger value="notes">` `Заметки` / `Заметки менеджера` + `<Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{client.client_notes.length}</Badge>`
   - **Tab 1: Пакеты питания**:
     - Section Header: Title `Пакеты питания`, Subtitle `Управление рационами, доставками, заморозками и оплатами`, and `<AddPackageDialog clientId={clientId} />`.
     - Package Cards: mapping `client.packages.map(pkg => <PackageCard key={pkg.id} package={pkg} />)`.
     - Empty state if no packages: clean illustration card with `UtensilsCrossed` icon and `AddPackageDialog` CTA.
   - **Tab 2: Заметки менеджера**:
     - Section Header + `<AddNoteForm clientId={clientId} />`.
     - Timeline list of notes with `NotebookPen` icon, author/timestamp, formatted multiline text.

---

### 2.2 Requirement R3: Package Card 3-Zone Redesign Blueprint

```
+----------------------------------------------------------------------------------------------------+
| ZONE 1: HEADER                                                                                    |
| [ICON] Пакет 3X  [3X пакет]           [Активен (Emerald)]  [Долг: 7 000 сом (Rose)]                |
|        Период: 12 авг 2026 — 01 сен 2026                                                           |
+----------------------------------------------------------------------------------------------------+
| ZONE 2: DELIVERY PROGRESS                                                                          |
| Прогресс доставки                      Использовано 6 из 25 дней (24%)          [ 19 дн. осталось ]|
| [█████████████-----------------------------------------------------------------------------------] |
| [ Базовых дней: 20 ]   [ Продлено: +5 дн. ]   [ Заморожено дней: 2 ]   [ Доставок: 6 ]             |
+----------------------------------------------------------------------------------------------------+
| ZONE 3: FINANCIAL SUMMARY                                                                          |
| +-----------------------------+ +-----------------------------+ +--------------------------------+ |
| | Итого к оплате              | | Оплачено                    | | Остаток / Долг                 | |
| | (Общая стоимость)           | |                             | |                                | |
| | 12 900 сом                  | | 5 900 сом                   | | 7 000 сом                      | |
| | Базовая: 11 000 + продл: 1900| | 2 платежа зафиксировано     | | ⚠️ Требуется доплата          | |
| +-----------------------------+ +-----------------------------+ +--------------------------------+ |
+----------------------------------------------------------------------------------------------------+
| DIRECT ACTION BUTTONS (ALWAYS VISIBLE - NO EXTRA CLICKS!)                                          |
| [ + Добавить оплату ] [ + Добавить доставку ] [ Добавить заморозку ] [ Добавить продление ]        |
| [ Обновить статус ]                                                             [ Подробнее ▾ ]    |
+----------------------------------------------------------------------------------------------------+
| EXPANDABLE HISTORY DETAILS (Only when "Подробнее" is clicked)                                      |
| +-----------------------------------------------+ +----------------------------------------------+ |
| | История оплат                                 | | История доставок                             | |
| | + 3 000 сом — 12 авг 2026 (Аванс)             | | Дата питания: 13 авг 2026                     | |
| | + 2 900 сом — 18 авг 2026                     | | (Отправка курьером: 12 авг 2026, за 1 день)    | |
| +-----------------------------------------------+ +----------------------------------------------+ |
| | Заморозки                                     | | Продления                                    | |
| | 14 авг — 15 авг (2 дня)                       | | +5 дней (на 18 авг 2026)                      | |
| | Причина: Командировка                         | | Доплата: 1 900 сом                           | |
| +-----------------------------------------------+ +----------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
```

#### Detailed Calculations & Zone Logic in `PackageCard.tsx`:
1. **Mathematical derivations**:
   - `effectiveDays = pkg.total_days + pkg.extension_days`
   - `totalObligation = pkg.price + pkg.extension_added_price`
   - `progressPercent = effectiveDays > 0 ? Math.min(100, Math.max(0, Math.round((pkg.days_used / effectiveDays) * 100))) : 0`

2. **Zone 1: Header**:
   - Title: `Пакет {pkg.meal_type}` (e.g. `Пакет 3X` or `Пакет 5X`) + inline badge `{pkg.meal_type} пакет` (to satisfy Playwright test `getByText("3X пакет")`).
   - Dates: `<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="size-3.5" /> Период: {formatDate(pkg.start_date)} — {formatDate(pkg.end_date)}</span>`.
   - Semantic Status Badge:
     - `active`: `<Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Активен</Badge>`
     - `paused`: `<Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">На паузе</Badge>`
     - `completed`: `<Badge className="bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30">Завершен</Badge>`
   - Debt Badge:
     - `pkg.debt > 0`: `<Badge variant="destructive" className="bg-rose-600 text-white font-bold tabular-nums">Долг: {currencyFormatter.format(pkg.debt)}</Badge>`
     - `pkg.debt === 0`: `<Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Долг: 0 сом</Badge>`

3. **Zone 2: Delivery Progress**:
   - Top line:
     - Label: `Прогресс доставки`
     - Status: `Использовано ${pkg.days_used} из ${effectiveDays} дней (${progressPercent}%)`
     - Remaining: `<Badge variant="outline" className="tabular-nums font-semibold">${pkg.days_remaining} дн. осталось</Badge>`
   - Progress bar:
     - `<div className="h-3 w-full rounded-full bg-muted/80 border border-border/40 overflow-hidden">`
     - `<div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />`
   - Metadata pills row below bar:
     - `<span className="text-xs bg-muted/60 border rounded-md px-2 py-1 font-medium">Базовых дней: {pkg.total_days}</span>`
     - `<span className="text-xs bg-muted/60 border rounded-md px-2 py-1 font-medium">Продлено: +{pkg.extension_days} дн.</span>`
     - `<span className="text-xs bg-muted/60 border rounded-md px-2 py-1 font-medium">Заморожено дней: {pkg.freeze_days}</span>` (Matches test: `getByText("Заморожено дней: 2")`)
     - `<span className="text-xs bg-muted/60 border rounded-md px-2 py-1 font-medium">Доставок выполнено: {pkg.deliveries_count}</span>`

4. **Zone 3: Financial Summary**:
   - 3 Column Grid (`grid grid-cols-1 md:grid-cols-3 gap-3`):
     - **Card 1: Итого к оплате (Общая стоимость)**:
       - Header: `<p className="text-xs uppercase font-semibold text-muted-foreground tracking-wide">Итого к оплате (Общая стоимость)</p>`
       - Value: `<p className="text-2xl font-extrabold tracking-tight tabular-nums mt-1">{currencyFormatter.format(totalObligation)}</p>`
       - Footer: `<p className="text-xs text-muted-foreground mt-1">Базовая: {currencyFormatter.format(pkg.price)}{pkg.extension_added_price > 0 ? ` + продления: ${currencyFormatter.format(pkg.extension_added_price)}` : ""}</p>`
     - **Card 2: Оплачено**:
       - Header: `<p className="text-xs uppercase font-semibold text-muted-foreground tracking-wide">Оплачено</p>`
       - Value: `<p className="text-2xl font-extrabold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">{currencyFormatter.format(pkg.paid_amount)}</p>`
       - Footer: `<p className="text-xs text-muted-foreground mt-1">{pkg.payments.length} платеж(ей) зафиксировано</p>`
     - **Card 3: Остаток / Долг**:
       - Header: `<p className="text-xs uppercase font-semibold text-muted-foreground tracking-wide">Остаток / Долг</p>`
       - Value: `<p className={`text-2xl font-extrabold tracking-tight tabular-nums mt-1 ${pkg.debt > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{currencyFormatter.format(pkg.debt)}</p>`
       - Footer: `<p className="text-xs text-muted-foreground mt-1">{pkg.debt > 0 ? "⚠️ Требуется доплата" : "✓ Оплачен полностью"}</p>`

5. **Direct Action Buttons Row**:
   - Buttons bar:
     - `AddPaymentDialog`: button text `Добавить оплату` with `CreditCard` icon.
     - `AddDeliveryDialog`: button text `Добавить доставку` with `Package2` icon.
     - `AddFreezeDialog`: button text `Добавить заморозку` with `Clock3` icon.
     - `AddExtensionDialog`: button text `Добавить продление` with `Calendar` icon.
     - `UpdatePackageStatusDialog`: button text `Обновить статус` with `SlidersHorizontal` icon.
     - Expand trigger: `<Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>{isExpanded ? "Скрыть детали" : "Подробнее"} {isExpanded ? <ChevronUp className="size-4 ml-1" /> : <ChevronDown className="size-4 ml-1" />}</Button>`.

6. **Expandable History Section**:
   - Rendered when `isExpanded` is true:
     - 4 Section Cards in a 2x2 grid (`grid gap-4 lg:grid-cols-2`):
       - **История оплат**: payment amount (`tabular-nums font-bold text-sm`), date, comment.
       - **История доставок**:
         - `Дата питания: {formatDate(delivery.scheduled_date)}`
         - `Дата передачи / сборки (отправка курьером): {formatDate(delivery.sent_date)}`
       - **Заморозки**:
         - `{formatDate(freeze.start_date)} → {formatDate(freeze.end_date)}`
         - `Количество дней заморозки: {frozenDays}`
         - `Причина: {freeze.reason}`
       - **Продления**:
         - `+{extension.extra_days} дней (на дату {formatDate(extension.date)})` (Matches test: `getByText("+5 дней (на")`)
         - `Доплата: {currencyFormatter.format(extension.added_price)}` (Matches test: `getByText("Доплата: 1 900")`)
         - `Причина: {extension.reason}`

---

### 2.3 Verification of Form Labels, Toast Messages, & E2E Selectors

To guarantee 100% Playwright test pass rate without weakening any assertions, the following exact labels must be set:

| File | Element | Current Value | Required Exact Value | Reason / Test Selector |
|---|---|---|---|---|
| `AddPackageDialog.tsx` | Total days label | `Всего дней` | `Кол-во дней` | `page.getByLabel("Кол-во дней")` (test line 124) |
| `AddPackageDialog.tsx` | Price label | `Стоимость` | `Цена` | `page.getByLabel("Цена")` (test line 125) |
| `AddNoteForm.tsx` | Note text label | `Добавить заметку` | `Новая заметка` | `page.getByLabel("Новая заметка")` (test line 519) |
| `PackageCard.tsx` (AddDeliveryDialog) | Sent date label | `Дата отправки / списания` | `Дата передачи / сборки` | `page.getByLabel("Дата передачи / сборки")` (test line 171) |
| `PackageCard.tsx` (AddPaymentDialog) | Trigger button | `Зафиксировать оплату` | `Добавить оплату` | `page.getByRole("button", { name: "Добавить оплату" })` (test line 271) |
| `PackageCard.tsx` (AddFreezeDialog) | Trigger button | `Заморозить пакет` | `Добавить заморозку` | `page.getByRole("button", { name: "Добавить заморозку" })` (test line 205) |
| `PackageCard.tsx` (AddExtensionDialog) | Trigger button | `Продлить пакет` | `Добавить продление` | `page.getByRole("button", { name: "Добавить продление" })` (test line 237) |
| `PackageCard.tsx` (UpdatePackageStatusDialog) | Trigger button | `Изменить статус` | `Обновить статус` | `page.getByRole("button", { name: "Обновить статус" })` (test line 330) |
| `PackageCard.tsx` (UpdatePackageStatusDialog) | Success Toast | `"Статус пакета успешно изменен"` | `"Статус пакета успешно обновлен"` | `page.getByText("Статус пакета успешно обновлен")` (test line 334) |
| `PackageCard.tsx` | Expand button | `Показать детали` | `Подробнее` | `page.getByRole("button", { name: "Подробнее" })` (test line 166, 183, 203) |
| `PackageCard.tsx` | Title | `Пакет 3X` | `Пакет 3X` + `3X пакет` badge | `page.getByText("3X пакет")` (test line 130, 477) |
| `PackageCard.tsx` | Freeze summary badge | `Заморозки (дней)` | `Заморожено дней: {N}` | `page.getByText("Заморожено дней: 2")` (test line 212) |
| `PackageCard.tsx` | Extension history item | `+{N} дней от {date}` | `+{N} дней (на {date})` | `page.getByText("+5 дней (на")` (test line 244) |
| `PackageCard.tsx` | Obligation title | `Итого к оплате` | `Итого к оплате (Общая стоимость)` | `page.getByText(/Общая стоимость/)` (test line 367) |

---

## 3. Caveats

1. **Backend Freezing**:
   - Backend endpoints and schemas cannot be changed. All delivery calculation logic (`diff === 1` day between `scheduled_date` and `sent_date`) must remain strictly enforced on the frontend form validation.
2. **Client Status Mutation**:
   - `EditClientDialog` allows updating client status (`new`, `active`, `paused`, `completed`, `debt`, `archived`), but individual package status is updated via `UpdatePackageStatusDialog` (`active`, `paused`, `completed`). These two separate mutation flows must remain distinct.
3. **No extra dependencies**:
   - The visual progress bar does not require adding `@radix-ui/react-progress`; standard Tailwind v4 `div` styling is cleaner, faster, zero bundle overhead, and fully customizable.

---

## 4. Conclusion

The plan for R2 and R3 solves all requirements from the design concept and ensures strict test compatibility:
1. `clients.$clientId.tsx` transforms into a clean client profile hub with back navigation, status-colored avatar initials, contact details with clickable links, debt callout, quick KPI counters, and tabbed sections with live counter badges.
2. `PackageCard.tsx` completely eliminates the 14 flat grey SummaryLine tiles in favor of the approved 3-Zone Card (Zone 1 Header, Zone 2 Delivery Progress bar, Zone 3 3-Pillar Financial Summary), directly accessible action buttons row, and expandable history tabs below.
3. All dialogs, form schemas, and mutations retain 100% functional integrity while aligning field labels and button names with the Playwright test suite.
4. Complete TypeScript build safety and zero type errors.

---

## 5. Verification Method

To independently verify after implementation:

1. **TypeScript & Vite Build**:
   ```bash
   cd frontend
   npm run build
   ```
   *Expected result*: Build completes with 0 errors (`tsc` + Vite build).

2. **Playwright E2E Tests**:
   Ensure Docker containers are running (`docker compose up -d db mailpit backend`), then run:
   ```bash
   cd frontend
   bunx playwright test tests/clients.spec.ts
   ```
   *Expected result*: All 15+ tests in `clients.spec.ts` pass cleanly (including 3X/5X package creation, deliveries, freezes, extensions, partial payments, debt calculations, package status update, notes, and delivery counter).

3. **Visual & Responsive Spot-Check**:
   - Check Client Detail page at mobile width (375px) — no horizontal overflow.
   - Verify tabular numbers on all currency and numeric values.
   - Verify debt badges turn red (`bg-rose-500` / `text-rose-600`) when `debt > 0`.
