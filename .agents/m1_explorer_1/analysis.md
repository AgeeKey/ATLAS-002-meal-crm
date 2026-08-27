# Milestone 1 (M1) Deep Technical Analysis: Design System, Tokens, Shell & Layout

**Target Project:** Atlas Meal CRM (`frontend/`)  
**Milestone:** M1 — Design System, Tokens, Shell & Layout (Requirement R4)  
**Author:** `m1_explorer_1`  
**Date:** 2026-08-27  

---

## 1. Executive Summary

Milestone 1 establishes the visual foundation and global application shell for Atlas Meal CRM. The backend (FastAPI, PostgreSQL, Mailpit at `localhost:8000`) and API client are completely frozen. All 75 Playwright E2E tests must be preserved without regressions.

While preliminary emerald tokens and basic components exist on `main`, this investigation identified **critical defects, residual English text, and test-breaking button label mismatches** that must be resolved in M1.

### Key Critical Findings:
1. **Critical Test-Breaking Button Labels in Admin & User Modals:**
   - `frontend/src/components/Admin/EditUser.tsx` uses English `"Cancel"` (line 225) and `"Save"` (line 229), which fails `admin.spec.ts` (line 94 expects `"Сохранить"`).
   - `frontend/src/components/Admin/DeleteUser.tsx` uses English `"Cancel"` (line 78) and `"Delete"` (line 86), which fails `admin.spec.ts` (line 121 expects `"Удалить"`).
   - `frontend/src/components/UserSettings/DeleteConfirmation.tsx` uses English `"Delete Account"` (line 47), `"Cancel"` (line 65), and `"Delete"` (line 73).
2. **Residual Template Branding in `index.html`:**
   - `<title>Full Stack FastAPI Project</title>` and `<html lang="en">` remain in `frontend/index.html`.
3. **Sidebar Sub-Route Active State Bug:**
   - In `frontend/src/components/Sidebar/Main.tsx`, `isActive` uses strict equality (`currentPath === item.path`). Navigating to `/clients/:id` causes the "Клиенты" navigation item to lose its active highlight.
4. **Icon-Collapse Glitch in Sidebar User Profile:**
   - In `frontend/src/components/Sidebar/User.tsx`, user name, email, and chevrons lack `group-data-[collapsible=icon]:hidden`, causing visual overflow when the sidebar is collapsed on desktop.
5. **English Strings in Common Utility Components:**
   - `Appearance.tsx`: Tooltips and labels use `"Appearance"`, `"Light"`, `"Dark"`, `"System"`.
   - `DataTable.tsx`: Empty state `"No results found."`, pagination `"Showing X to Y of Z entries"`, `"Rows per page"`, `"Page X of Y"`.
   - `NotFound.tsx` and `ErrorComponent.tsx`: English 404/Error fallbacks.
6. **Build Blocker in TypeScript:**
   - Unused imports in `clients.tsx` and `index.tsx` cause `tsc -p tsconfig.build.json` to fail in strict `noUnusedLocals` mode.

---

## 2. Token & Design System Architecture (`frontend/src/index.css`)

### 2.1 Approved OKLCH Emerald Color Palette
The color system uses high-chroma fresh emerald tones for primary branding and semantic status indicators:

| Token | Light Value | Dark Value | Purpose |
|---|---|---|---|
| `--primary` | `oklch(0.54 0.15 156)` | `oklch(0.66 0.15 156)` | Emerald Brand Primary |
| `--primary-foreground` | `oklch(0.99 0 0)` | `oklch(0.12 0.03 156)` | Contrast text on primary |
| `--background` | `oklch(0.99 0.002 120)` | `oklch(0.14 0.015 240)` | Main canvas |
| `--foreground` | `oklch(0.18 0.02 240)` | `oklch(0.98 0.005 240)` | Main typography |
| `--card` | `oklch(1 0 0)` | `oklch(0.18 0.018 240)` | Card containers |
| `--muted` | `oklch(0.96 0.005 240)` | `oklch(0.22 0.015 240)` | Secondary backgrounds |
| `--muted-foreground`| `oklch(0.52 0.02 240)` | `oklch(0.68 0.02 240)` | Subdued captions & hints |
| `--border` | `oklch(0.91 0.005 240)` | `oklch(0.28 0.015 240)` | Subtle borders |
| `--radius` | `0.75rem` (12px) | `0.75rem` (12px) | Modern smooth corners |

### 2.2 Semantic Status System
To ensure CRM consistency across M1–M4, the design system defines dedicated status tokens:
- **Active (`active`):** Emerald (`text-emerald-600 dark:text-emerald-400`, `bg-emerald-500/10`, `border-emerald-500/20`)
- **Paused (`paused`):** Amber (`text-amber-600 dark:text-amber-400`, `bg-amber-500/10`, `border-amber-500/20`)
- **Debt (`debt` / Critical):** Rose/Red (`text-rose-600 dark:text-rose-400`, `bg-rose-500/10`, `border-rose-500/20`)
- **Completed / Archive (`completed`, `archived`):** Slate/Zinc (`text-muted-foreground`, `bg-muted`, `border-border`)

### 2.3 Typography & Tabular Numerals
- **Numeric Data:** All prices (`KGS` / `сом`), counts, dates, and days remaining must apply `tabular-nums`.
- **Headings:** Set `text-wrap: balance` on `h1..h6` in `@layer base` of `index.css`.
- **Inter font features:** Enable OpenType tabular numbers and contextual alternates.

---

## 3. Global Shell & Navigation Architecture

### 3.1 Header (`frontend/src/routes/_layout.tsx`)
```tsx
// Current:
<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur-xs">
  <div className="flex items-center gap-2">
    <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
    <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
    <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
      {/* Date */}
    </span>
  </div>
  <div className="flex items-center gap-2">
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Рабочая смена активна
    </span>
  </div>
</header>
```
**Enhancements:**
- Format Russian date with capitalized weekday (e.g. `Четверг, 27 августа`).
- Ensure sticky backdrop blur (`backdrop-blur-md bg-background/80`).
- Ensure main content wrapper has `overflow-x-hidden` and `w-full` to prevent horizontal scrolling on mobile (375px).

### 3.2 Sidebar Navigation (`frontend/src/components/Sidebar/`)
- **`AppSidebar.tsx`**:
  - Preserves base links: `Дашборд` (`/`), `Клиенты` (`/clients`), plus `Админ-панель` (`/admin`) for superusers.
  - Collapsible icon mode (`collapsible="icon"`).
- **`Main.tsx` Active State Fix**:
  ```tsx
  // Proposed Fix:
  const isActive = item.path === "/" 
    ? currentPath === "/" 
    : currentPath.startsWith(item.path)
  ```
- **`User.tsx` Collapsed Mode Fix**:
  - Add `group-data-[collapsible=icon]:hidden` to name/email and chevron wrapper.
  - Use emerald fallback: `<AvatarFallback className="bg-primary text-primary-foreground">`.
  - Preserve `data-testid="user-menu"` on `SidebarMenuButton`.
- **`Appearance.tsx` Russian Translation**:
  - Label: `"Оформление"` (sr-only: `"Переключить тему"`).
  - Menu Items: `data-testid="light-mode"` -> `"Светлая"`, `data-testid="dark-mode"` -> `"Темная"`, `"Системная"`.

### 3.3 Live Pulse Footer (`frontend/src/components/Common/Footer.tsx`)
- Elevated radar pulse effect:
  ```tsx
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
  </span>
  <span className="text-xs text-muted-foreground">Сервер активен</span>
  ```
- Text: `"Atlas Meal CRM • Система управления доставкой рационов питания"`
- Copyright: `"© {currentYear} Atlas"`

---

## 4. Auth Suite Polish (`login.tsx`, `signup.tsx`, `recover-password.tsx`, `reset-password.tsx`)

All auth routes use `AuthLayout.tsx` which presents a branded split-screen (desktop) / focused card (mobile).

| Route | Page Title | Required Selectors / Test IDs | Button Text |
|---|---|---|---|
| `/login` | Вход в систему | `data-testid="email-input"`, `data-testid="password-input"` | `"Войти"` |
| `/signup` | Создать аккаунт | `data-testid="full-name-input"`, `data-testid="email-input"`, `data-testid="password-input"`, `data-testid="confirm-password-input"` | `"Зарегистрироваться"` |
| `/recover-password` | Восстановление пароля | `data-testid="email-input"` | `"Продолжить"` |
| `/reset-password` | Сбросить пароль | `data-testid="new-password-input"`, `data-testid="confirm-password-input"` | `"Сбросить пароль"` |

---

## 5. Admin & Settings Pages Polish

### 5.1 Admin Users Page (`frontend/src/routes/_layout/admin.tsx` & `components/Admin/*`)
- Heading: `"Пользователи"`, description: `"Управление пользователями и правами доступа"`.
- Button: `"Добавить пользователя"`.
- Table columns: `"ФИО"`, `"Email"`, `"Роль"` (`"Администратор"` / `"Пользователь"`), `"Статус"` (`"Активен"` / `"Неактивен"`). Current user badge: `"Вы"` (instead of English `"You"`).
- **Edit Modal (`EditUser.tsx`):**
  - Cancel button: `"Отменить"` (MUST replace `"Cancel"`).
  - Submit button: `"Сохранить"` (MUST replace `"Save"`).
- **Delete Modal (`DeleteUser.tsx`):**
  - Cancel button: `"Отменить"` (MUST replace `"Cancel"`).
  - Submit button: `"Удалить"` (MUST replace `"Delete"`).

### 5.2 Settings Page (`frontend/src/routes/_layout/settings.tsx` & `components/UserSettings/*`)
- Tabs: `"Мой профиль"`, `"Пароль"`, `"Опасная зона"`.
- **Profile Tab (`UserInformation.tsx`):** `"Редактировать"`, `"Сохранить"`, `"Отменить"`.
- **Password Tab (`ChangePassword.tsx`):** `"Текущий пароль"`, `"Новый пароль"`, `"Подтвердите пароль"`, `"Обновить пароль"`.
- **Danger Zone Tab (`DeleteAccount.tsx` / `DeleteConfirmation.tsx`):**
  - Button trigger: `"Удалить аккаунт"` (MUST replace `"Delete Account"`).
  - Modal buttons: `"Отменить"` and `"Удалить"` (MUST replace `"Cancel"` and `"Delete"`).

---

## 6. Common Components Localization & Polish

### 6.1 `DataTable.tsx`
- Empty state: `"Данные отсутствуют"` (replaces `"No results found."`).
- Pagination text: `"Показано с {from} по {to} из {total} записей"` (replaces `"Showing X to Y of Z entries"`).
- Page size label: `"Строк на странице"`.
- Page indicator: `"Страница {page} из {totalPages}"`.
- Screen reader accessibility labels: `"На первую страницу"`, `"На предыдущую страницу"`, `"На следующую страницу"`, `"На последнюю страницу"`.

### 6.2 `NotFound.tsx` & `ErrorComponent.tsx`
- 404: `"404"`, `"Страница не найдена"`, `"Запрашиваемая страница не существует или была перемещена."`, Button: `"На главную"`.
- Error: `"Ошибка"`, `"Что-то пошло не так"`, `"Произошла непредвиденная ошибка. Попробуйте обновить страницу."`, Button: `"На главную"`.

### 6.3 `frontend/index.html`
- Replace `<title>Full Stack FastAPI Project</title>` with `<title>Atlas Meal CRM — Управление доставкой рационов</title>`.
- Set `<html lang="ru">`.

---

## 7. Playwright E2E Selector & Regression Matrix

| Test File | Spec Count | Tested Selectors / Text | Verification Status |
|---|---|---|---|
| `auth.setup.ts` | 1 | `email-input`, `password-input`, `"Войти"` | PASS compatible |
| `login.spec.ts` | 9 | `email-input`, `password-input`, `"Войти"`, `"Забыли пароль?"`, `"Зарегистрироваться"`, `user-menu`, `"Выйти"` | PASS compatible |
| `sign-up.spec.ts` | 11 | `full-name-input`, `email-input`, `password-input`, `confirm-password-input`, `"Зарегистрироваться"`, `"Войти"` | PASS compatible |
| `reset-password.spec.ts` | 6 | `email-input`, `"Восстановление пароля"`, `"Продолжить"`, `new-password-input`, `confirm-password-input`, `"Сбросить пароль"` | PASS compatible |
| `user-settings.spec.ts` | 14 | `"Мой профиль"`, `"Пароль"`, `"Опасная зона"`, `"Редактировать"`, `"Сохранить"`, `"Отменить"`, `current-password-input`, `new-password-input`, `confirm-password-input`, `"Обновить пароль"`, `theme-button`, `light-mode`, `dark-mode` | PASS compatible |
| `admin.spec.ts` | 12 | `"Пользователи"`, `"Добавить пользователя"`, `"Сохранить"`, `"Отменить"`, `"Удалить"`, `"Администратор"` | PASS compatible with proposed fixes |
| `items.spec.ts` | 2 | Legacy `/items` -> `/clients` redirect | PASS compatible |
| `clients.spec.ts` | 20 | Add client, package cards, etc. (M3/M4) | Protected by shell stability |

---

## 8. Detailed Actionable Implementation Plan for M1 Implementer

### Step 1: `frontend/src/index.css`
- Add `@layer base { h1, h2, h3, h4, h5, h6 { text-wrap: balance; } }`.
- Ensure custom status colors and `tabular-nums` formatting utility classes are present and documented.

### Step 2: `frontend/index.html`
- Update `<title>` to `"Atlas Meal CRM — Управление доставкой рационов"` and `<html lang="ru">`.

### Step 3: Global Shell & Header
- `frontend/src/routes/_layout.tsx`: Format header date with uppercase weekday, ensure responsive layout with zero horizontal overflow (`overflow-x-hidden`).
- `frontend/src/components/Common/Footer.tsx`: Enhanced live pulse radar dot, Russian status text.
- `frontend/src/components/Common/Logo.tsx`: Add `aria-label="Atlas Meal CRM — На главную"`.

### Step 4: Sidebar Polish & Fixes
- `frontend/src/components/Sidebar/Main.tsx`: Fix `isActive` for sub-routes (`currentPath.startsWith(item.path)`).
- `frontend/src/components/Sidebar/User.tsx`: Add `group-data-[collapsible=icon]:hidden` to user text/chevrons, use emerald avatar fallback.
- `frontend/src/components/Common/Appearance.tsx`: Translate labels to Russian while preserving `theme-button`, `light-mode`, `dark-mode` test IDs.

### Step 5: Admin & Settings Russian Button Labels Fix
- `frontend/src/components/Admin/EditUser.tsx`: Change `"Cancel"` -> `"Отменить"`, `"Save"` -> `"Сохранить"`.
- `frontend/src/components/Admin/DeleteUser.tsx`: Change `"Cancel"` -> `"Отменить"`, `"Delete"` -> `"Удалить"`.
- `frontend/src/components/Admin/columns.tsx`: Change `"You"` -> `"Вы"`.
- `frontend/src/components/UserSettings/DeleteConfirmation.tsx`: Change `"Delete Account"` -> `"Удалить аккаунт"`, `"Cancel"` -> `"Отменить"`, `"Delete"` -> `"Удалить"`.

### Step 6: Common Components Localization
- `frontend/src/components/Common/DataTable.tsx`: Russian empty state and pagination strings.
- `frontend/src/components/Common/NotFound.tsx`: Russian 404 page.
- `frontend/src/components/Common/ErrorComponent.tsx`: Russian error fallback.

### Step 7: Build Verification & TypeScript Cleanup
- Remove unused imports in `clients.tsx` and `index.tsx` so `npm run build` (`tsc -p tsconfig.build.json && vite build`) passes with 0 errors.
- Run Playwright E2E tests (`admin.spec.ts`, `login.spec.ts`, `sign-up.spec.ts`, `reset-password.spec.ts`, `user-settings.spec.ts`).
