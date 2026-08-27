# Handoff Report: Investigation of Atlas Meal CRM Frontend Components

**Date:** 2026-08-27  
**Agent:** `survey_explorer_2` (Teamwork Explorer)  
**Task:** Investigate Atlas Meal CRM frontend codebase and report on Dashboard, Client List, Client Detail & Package Card, and APIs/Types/Hooks.

---

## 1. Observation

1. **Build State (`npm run build` / `tsc -p tsconfig.build.json`):**
   - Command `tsc -p tsconfig.build.json && vite build` failed with exit code 1.
   - Exact compiler errors:
     - `src/routes/_layout/clients.tsx(14,3)`: error TS6133: 'ArrowRight' is declared but its value is never read.
     - `src/routes/_layout/clients.tsx(15,3)`: error TS6133: 'Filter' is declared but its value is never read.
     - `src/routes/_layout/clients.tsx(16,3)`: error TS6133: 'MapPin' is declared but its value is never read.
     - `src/routes/_layout/clients.tsx(17,3)`: error TS6133: 'Phone' is declared but its value is never read.
     - `src/routes/_layout/clients.tsx(20,3)`: error TS6133: 'User' is declared but its value is never read.
     - `src/routes/_layout/clients.tsx(21,3)`: error TS6133: 'X' is declared but its value is never read.
     - `src/routes/_layout/index.tsx(6,3)`: error TS6133: 'Calendar' is declared but its value is never read.
     - `src/routes/_layout/index.tsx(9,3)`: error TS6133: 'TrendingUp' is declared but its value is never read.
     - `src/routes/_layout/index.tsx(13,15)`: error TS6133: 'ReactNode' is declared but its value is never read.
   - Aside from these 9 unused identifier errors, the entire TypeScript codebase typechecks with 0 errors.

2. **Dashboard (`frontend/src/routes/_layout/index.tsx`):**
   - Contains operational cockpit layout with:
     - Hero card for "Доставки на сегодня" with required `data-testid="todays-deliveries-value"`.
     - KPI cards for "Активные клиенты", "Заканчивающиеся пакеты (до 7 дней)", "Сумма долгов".
     - Action Center ("Требуют внимания менеджера") listing expiring packages and debt clients.
     - Meal Breakdown (3X vs 5X) bar charts and daily kitchen production calculation `(3X * 3 + 5X * 5)`.
   - Text elements required by `frontend/tests/clients.spec.ts` ("Добро пожаловать в панель управления CRM!", "Сводка CRM", "Активные клиенты", "Доставки на сегодня") are present.

3. **Client List (`frontend/src/routes/_layout/clients.tsx`):**
   - Currently uses a hidden `<Select>` dropdown for status filter instead of filter pills with live counts.
   - Table columns only show flat client properties without avatar, phone link, address map pin, mini package summary (`3X • ост. N дн.`), or debt badge.
   - `AddClientDialog` is fully functional with Zod validation and matches test selectors ("Добавить клиента", "Добавление клиента", "Имя *", "Телефон *", "Сохранить").

4. **Client Detail (`frontend/src/routes/_layout/clients.$clientId.tsx`) & Package Card (`frontend/src/components/Clients/PackageCard.tsx`):**
   - `clients.$clientId.tsx` provides client profile header, info tiles, and tabs for "Пакеты питания" and "Заметки менеджера".
   - `AddNoteForm.tsx:73` currently uses `<FormLabel>Добавить заметку</FormLabel>`, but `tests/clients.spec.ts:519` expects `page.getByLabel("Новая заметка")`.
   - `PackageCard.tsx` currently renders 14 flat grey summary tiles (`SummaryLine`).
   - Button in `PackageCard.tsx:218` is labeled `"Показать детали"` / `"Скрыть детали"`, while `tests/clients.spec.ts` clicks `page.getByRole("button", { name: "Подробнее" })`.
   - Action buttons in `PackageCard.tsx` currently use labels like `"Зафиксировать оплату"`, `"Заморозить пакет"`, `"Продлить пакет"`, `"Изменить статус"`, while Playwright tests expect `"Добавить оплату"`, `"Добавить заморозку"`, `"Добавить продление"`, `"Обновить статус"`.

5. **Client APIs and Types (`frontend/src/client/`):**
   - Fully generated types (`CrmClientDetail`, `CrmPackageDetail`, `CrmDeliveryPublic`, `CrmPaymentPublic`, `CrmFreezePublic`, `CrmExtensionPublic`, `CrmNotePublic`, `CrmDailyDeliveryCount`).
   - Services `ClientsService`, `PackagesService`, and `PaymentsService` have all required API methods with correct endpoints and parameters.

---

## 2. Logic Chain

1. **TypeScript Build:**
   - Observation: 9 TS6133 errors occur during `tsc -p tsconfig.build.json`.
   - Logic: Removing the 3 unused imports from `index.tsx` and 6 unused imports from `clients.tsx` (or utilizing needed ones like `MapPin`, `Phone`, `ArrowRight` in the redesigned table) will immediately restore zero-error compilation for `npm run build`.

2. **Client List Redesign:**
   - Observation: Requirement R2 and approved design document call for visible filter pills with live counts and rich table rows.
   - Logic: By fetching packages alongside clients (`PackagesService.readPackages`), we can compute live counts per status (`Все`, `Активные`, `С долгом`, `На паузе`, `Новые`, `Завершенные`, `Архив`), display mini package status (`3X • ост. N дн.`), and display prominent debt badges (`5 000 сом` vs `Оплачено`).

3. **Package Card Redesign:**
   - Observation: Requirement R3 and approved design document call for replacing the 14 flat data tiles with a 3-zone layout (Status/Period -> Delivery Progress Bar -> Financials: Total/Paid/Debt) and 1-click action buttons.
   - Logic: Refactoring `PackageCard.tsx` into the 3-zone visual layout while ensuring action buttons and expand triggers match Playwright test names ("Подробнее", "Добавить доставку", "Добавить оплату", "Добавить заморозку", "Добавить продление", "Обновить статус") will simultaneously satisfy the visual design requirements and ensure 100% test compatibility.

4. **AddNoteForm Compatibility:**
   - Observation: `clients.spec.ts:519` searches for `getByLabel("Новая заметка")`.
   - Logic: Updating `<FormLabel>` in `AddNoteForm.tsx` to `"Новая заметка"` prevents selector mismatch failure.

---

## 3. Caveats

1. **Backend & Docker:**
   - Backend logic and database schema are frozen and cannot be modified. All UI aggregations (e.g. debt mapping on client list) must be computed in the frontend.
2. **Playwright Execution:**
   - Running full E2E tests requires the backend Docker containers (`docker compose up -d db mailpit backend`). In environments without running backend services, tests should be verified once services are up.

---

## 4. Conclusion

- The frontend architecture, emerald color token system, TanStack Router routing, and OpenAPI client integration are in excellent health.
- Detailed implementation specifications and selector mappings are fully documented in `survey_crm_components.md`.
- Resolving the 9 unused variable errors, updating `AddNoteForm.tsx` label, implementing filter pills and rich table columns in `clients.tsx`, and applying the 3-zone layout to `PackageCard.tsx` will complete the MVP redesign with full Playwright test compatibility.

---

## 5. Verification Method

1. **TypeScript Build Verification:**
   - Command: `npm run build` in `frontend/`
   - Expected result: `tsc -p tsconfig.build.json && vite build` completes with exit code 0.
2. **Code Inspection:**
   - Verify `survey_crm_components.md` at `F:\ATLAS\ATLAS-002-meal-crm\.agents\survey_explorer_2\survey_crm_components.md`.
3. **Playwright Test Verification (when backend is running):**
   - Command: `npm test` or `npx playwright test` in `frontend/`
   - Expected result: Tests in `frontend/tests/clients.spec.ts` pass without selector errors.
