# E2E Test Infra: Atlas Meal CRM

## Test Philosophy
- Opaque-box requirement verification and regression prevention.
- Preservation of all 75 existing Playwright tests in `frontend/tests/`.
- Fast feedback with `npm run build` TypeScript verification and isolated Playwright executions.

## Test Architecture
- **E2E Runner:** Playwright (`npx playwright test` in `frontend/`)
- **Backend Stack:** `docker compose up -d db mailpit backend`
- **Single-Worker Safe Command:** `npx playwright test --workers=1` (prevents resource saturation)
- **Direct Build Validation:** `npm run build` in `frontend/` (TypeScript `tsc -b` + Vite bundle)

## Playwright Test Suite Inventory (75 Tests)
| Test File | Spec Count | Focus Area | Critical Selectors |
|-----------|-----------:|------------|-------------------|
| `auth.setup.ts` | 1 | Auth cookie & storage state | `email-input`, `password-input`, `"Войти"` |
| `admin.spec.ts` | 12 | User management & roles | `"Пользователи"`, `"Добавить пользователя"`, `"Сохранить"`, `"Отменить"`, `"Удалить"` |
| `clients.spec.ts` | 20 | Clients, Packages, Deliveries, Payments, Freeze, Extend | `todays-deliveries-value`, `"Добавить клиента"`, `"Имя *"`, `"Телефон *"`, `"Подробнее"`, `"Добавить доставку"`, `"Добавить оплату"`, `"Новая заметка"` |
| `items.spec.ts` | 2 | Legacy item route redirection | URL `/clients` redirect verification |
| `login.spec.ts` | 9 | Authentication & session guards | `email-input`, `password-input`, `"Войти"`, `"Зарегистрироваться"` |
| `reset-password.spec.ts` | 6 | Password reset email workflow | Mailpit API integration, `"Восстановление пароля"`, `"Сбросить пароль"` |
| `sign-up.spec.ts` | 11 | Registration flows & validation | `full-name-input`, `email-input`, `password-input`, `confirm-password-input` |
| `user-settings.spec.ts` | 14 | Profile, password & theme toggle | `user-menu`, `theme-button`, `light-mode`, `dark-mode`, `"Обновить пароль"` |
| **Total** | **75** | | |

## Critical Selector Matrix
| Selector | Type | Location | Tests Depending On It |
|----------|------|----------|-----------------------|
| `todays-deliveries-value` | `data-testid` | Dashboard Hero Card | `clients.spec.ts` (Test 33) |
| `user-menu` | `data-testid` | Layout Header / Sidebar | `user-settings.spec.ts` |
| `theme-button`, `light-mode`, `dark-mode` | `data-testid` | Settings / Appearance | `user-settings.spec.ts` |
| `email-input`, `password-input` | `data-testid` | Auth forms | `login.spec.ts`, `auth.setup.ts` |
| `full-name-input`, `confirm-password-input` | `data-testid` | Registration form | `sign-up.spec.ts` |
| `"Добавить клиента"` | Text (Button) | Clients list & Dashboard | `clients.spec.ts` |
| `"Имя *"`, `"Телефон *"` | Label | Add client dialog | `clients.spec.ts` |
| `"Подробнее"` | Text (Button/Accordion) | Package Card | `clients.spec.ts` |
| `"Новая заметка"` | Label (Input) | Client detail note section | `clients.spec.ts` |
| `"Сохранить"`, `"Отменить"`, `"Удалить"` | Text (Buttons) | Admin & Client Modals | `admin.spec.ts`, `clients.spec.ts` |

## Acceptance Verification Criteria
- `npm run build` completes with 0 errors and 0 TypeScript warnings.
- All 75 Playwright E2E tests pass (≥50/75 in parallel, 100% on sequential/isolated runs).
- Zero broken selectors.
- Responsive layout at 375px mobile width with no horizontal overflow.
- WCAG AA focus visibility on all interactive buttons and inputs.
