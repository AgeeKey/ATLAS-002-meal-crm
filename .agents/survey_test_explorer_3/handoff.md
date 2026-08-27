# Handoff Report: Test Suite Survey & Compatibility Analysis

**Author**: Explorer Subagent (`survey_test_explorer_3`)  
**Date**: 2026-08-27  
**Artifact**: `F:\ATLAS\ATLAS-002-meal-crm\.agents\survey_test_explorer_3\survey_test_suite.md`

---

## 1. Observation

Direct examination of the repository test files and frontend source code revealed the following facts:

1. **Test Files Located**:
   - `frontend/tests/auth.setup.ts` (17 lines): 1 setup test (`authenticate`). Line 13 verifies `Добро пожаловать в панель управления CRM!`, lines 8-10 fill `email-input`, `password-input` and click `"Войти"`.
   - `frontend/tests/admin.spec.ts` (207 lines): 12 tests covering admin page access, user creation, superuser assignment, editing, deletion, validation, and role-based route guard.
   - `frontend/tests/clients.spec.ts` (564 lines): 20 tests covering navigation, dashboard stats, package creation (3X/5X), delivery/freeze/extension persistence, partial payment debt calculation, reload survival, and today's delivery increment.
   - `frontend/tests/items.spec.ts` (15 lines): 2 tests verifying redirect from `/items` to `/clients` and absence of legacy `"Add Item"` buttons.
   - `frontend/tests/login.spec.ts` (118 lines): 9 tests covering inputs visibility, login success/failure, logout, and token expiration guards.
   - `frontend/tests/reset-password.spec.ts` (120 lines): 6 tests covering recovery form, Mailpit email reception, token validation, password strength, and login after reset.
   - `frontend/tests/sign-up.spec.ts` (161 lines): 11 tests covering signup input visibility, success flow, duplicate email error, password strength, and validation errors.
   - `frontend/tests/user-settings.spec.ts` (257 lines): 14 tests covering tab navigation (`"Мой профиль"`, `"Пароль"`, `"Опасная зона"`), profile editing, password changing, theme toggling (`"theme-button"`, `"light-mode"`, `"dark-mode"`), and theme persistence.
   - **Total Playwright Tests**: 1 setup + 74 specs = **75 tests**.

2. **Test Helper Functions**:
   - `frontend/tests/utils/user.ts`:
     - `signUpNewUser`: fills `full-name-input`, `email-input`, `password-input`, `confirm-password-input`, clicks `"Зарегистрироваться"`.
     - `logInUser`: fills `email-input`, `password-input`, clicks `"Войти"`, asserts URL `/\/$/` and text `"Добро пожаловать в панель управления CRM!"`.
     - `logOutUser`: clicks `user-menu`, clicks menuitem `"Выйти"`.
   - `frontend/tests/utils/mailpit.ts`: polls Mailpit API `/api/v1/search` with 5s timeout.
   - `frontend/tests/utils/privateApi.ts`: calls backend `/api/v1/private/users/` to create pre-verified users.
   - `frontend/tests/utils/random.ts`: generates pseudo-random credentials and names.

3. **Critical Selectors Observed in Tests**:
   - `data-testid`: `todays-deliveries-value`, `email-input`, `password-input`, `full-name-input`, `confirm-password-input`, `new-password-input`, `current-password-input`, `user-menu`, `theme-button`, `light-mode`, `dark-mode`.
   - Button text: `"Добавить клиента"`, `"Добавить пользователя"`, `"Сохранить"`, `"Отменить"`, `"Удалить"`, `"Войти"`, `"Зарегистрироваться"`, `"Добавить пакет"`, `"Сохранить пакет"`, `"Подробнее"`, `"Добавить доставку"`, `"Сохранить доставку"`, `"Добавить заморозку"`, `"Сохранить заморозку"`, `"Добавить продление"`, `"Сохранить продление"`, `"Добавить оплату"`, `"Сохранить оплату"`, `"Обновить статус"`, `"Сохранить статус"`, `"Сохранить заметку"`, `"Обновить пароль"`, `"Сбросить пароль"`, `"Продолжить"`.
   - Form Labels: `"Имя *"`, `"Телефон *"`, `"Email"`, `"ФИО"`, `"Кол-во дней"`, `"Цена"`, `"Дата начала"`, `"Дата питания"`, `"Дата передачи / сборки"`, `"Дата окончания"`, `"Доп. дни"`, `"Доплата"`, `"Дата"`, `"Сумма"`, `"Новая заметка"`, `"Администратор?"`, `"Активен?"`.
   - Headings: `"Пользователи"`, `"Клиенты"`, `"Сводка CRM"`, `"Добавление клиента"`, `"Восстановление пароля"`.

4. **UI Button Discrepancies Observed in Source Code**:
   - In `frontend/src/components/Admin/DeleteUser.tsx`, line 78 has `Cancel` and line 86 has `Delete` instead of Russian `"Отменить"` and `"Удалить"`.
   - In `frontend/src/components/Admin/EditUser.tsx`, line 225 has `Cancel` and line 229 has `Save` instead of Russian `"Отменить"` and `"Сохранить"`.

5. **Test Runner & Environment**:
   - Local: `npx playwright test` (configured in `frontend/playwright.config.ts` with `fullyParallel: true`).
   - Docker: `docker compose run --rm playwright bun run test` with `PLAYWRIGHT_BASE_URL=http://backend:8000`.

---

## 2. Logic Chain

1. **Completeness of Test Suite**:
   - Enumerable count of all tests across all 8 test files in `frontend/tests/` sums to 1 + 12 + 20 + 2 + 9 + 6 + 11 + 14 = 75 tests.
   - Every single test was identified, matched with its describe block, name, purpose, and selectors.

2. **Selector Compatibility Invariant**:
   - The Playwright tests perform locator matching via exact strings (`getByRole("button", { name: "..." })`, `getByLabel("...")`, `getByPlaceholder("...")`, `getByTestId("...")`, and `getByText("...")`).
   - Any refactoring of the Dashboard (R1), Client List (R2), Package Card (R3), or Design System (R4) that changes or removes these exact strings or test IDs will cause immediate test failures.

3. **Concurrency & Resource Limits**:
   - In parallel execution mode (`fullyParallel: true`), multiple test workers run simultaneously against a single backend instance and Vite dev server.
   - Resource contention can cause intermittent `ERR_CONNECTION_REFUSED` timeouts. This is an expected artifact of Vite dev server limits noted in the user request.
   - In addition, tests sharing the PostgreSQL database (such as the `todays-deliveries-value` increment test in `clients.spec.ts`) are subject to race conditions if multiple workers create today's deliveries concurrently. Single-worker execution (`--workers=1`) isolates functional selector correctness from concurrency noise.

---

## 3. Caveats

- Backend unit tests (`backend/tests/` running via `pytest`) were cataloged for structural awareness, but are frozen and not subject to frontend redesign.
- Vite dev server network timeouts under extreme concurrency are distinct from UI selector mismatches.
- No caveats regarding completeness: 100% of all 75 tests and their selector requirements have been cataloged.

---

## 4. Conclusion

The testing suite contains 75 E2E tests with a well-defined set of Russian button strings, form labels, headings, and 11 critical `data-testid` attributes. The UI redesign can proceed cleanly across R1–R4 by strictly preserving this master selector registry.

A detailed, full-text survey report has been generated at `F:\ATLAS\ATLAS-002-meal-crm\.agents\survey_test_explorer_3\survey_test_suite.md`.

---

## 5. Verification Method

1. **Verify Test Inventory**:
   - Inspect `frontend/tests/*.spec.ts` and `frontend/tests/auth.setup.ts`. Count tests across files:
     - `auth.setup.ts` (1) + `admin.spec.ts` (12) + `clients.spec.ts` (20) + `items.spec.ts` (2) + `login.spec.ts` (9) + `reset-password.spec.ts` (6) + `sign-up.spec.ts` (11) + `user-settings.spec.ts` (14) = 75 tests.
2. **Verify Selector Occurrences**:
   - Inspect `survey_test_suite.md` against `frontend/src/` components to confirm all selectors exist in the UI tree.
3. **Execution Verification**:
   - Start stack: `docker compose up -d db mailpit backend`
   - Run tests: `cd frontend && npx playwright test`
   - Run single-worker test: `cd frontend && npx playwright test --workers=1`
