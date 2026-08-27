# Comprehensive Test Suite Inventory & Compatibility Report

**Report Location**: `F:\ATLAS\ATLAS-002-meal-crm\.agents\survey_test_explorer_3\survey_test_suite.md`  
**Date**: 2026-08-27  
**Scope**: Complete survey of all E2E Playwright tests (75 tests), test helpers, selectors, execution architecture, docker configs, and concurrency/failure modes.

---

## Executive Summary

The testing suite contains **75 Playwright E2E tests** (1 authentication setup test + 74 specification tests) located under `frontend/tests/`. The suite tests user authentication, administrative user management, client and subscription lifecycle operations (3X/5X packages, deliveries, freezes, extensions, partial payments/debt tracking), password resets via Mailpit, user profile settings, and theme switching.

All backend APIs, database schemas, and contracts are **frozen**. To maintain test compatibility during UI/UX redesigns (R1–R5), strict adherence to established data attributes (`data-testid`), button text (Russian labels), form labels, dialog titles, and toast messages is required.

---

## 1. Complete Inventory of All 75 Playwright Tests

| # | Spec File | Test Suite / Describe Block | Test Case Name | Key Assertions & Selectors |
|---|---|---|---|---|
| 1 | `auth.setup.ts` | Setup Project | `authenticate` | `getByTestId("email-input")`, `getByTestId("password-input")`, button `"Войти"`, text `"Добро пожаловать в панель управления CRM!"`, writes to `playwright/.auth/user.json` |
| 2 | `admin.spec.ts` | Top-level | `Admin page is accessible and shows correct title` | heading `"Пользователи"`, text `"Управление пользователями и правами доступа"` |
| 3 | `admin.spec.ts` | Top-level | `Add User button is visible` | button `"Добавить пользователя"` |
| 4 | `admin.spec.ts` | Admin user management | `Create a new user successfully` | button `"Добавить пользователя"`, placeholders: `"Email"`, `"ФИО"`, `"Пароль"`, button `"Сохранить"`, toast `"Пользователь успешно создан"`, row with email |
| 5 | `admin.spec.ts` | Admin user management | `Create a superuser` | checkboxes: `"Администратор?"`, `"Активен?"`, button `"Сохранить"`, tag `"Администратор"` in row |
| 6 | `admin.spec.ts` | Admin user management | `Edit a user successfully` | row action button, menuitem `"Редактировать"`, placeholder `"ФИО"`, button `"Сохранить"`, toast `"Пользователь успешно обновлен"` |
| 7 | `admin.spec.ts` | Admin user management | `Delete a user successfully` | row action button, menuitem `"Удалить"`, dialog confirm button `"Удалить"`, toast `"Пользователь успешно удален"` |
| 8 | `admin.spec.ts` | Admin user management | `Cancel user creation` | button `"Добавить пользователя"`, button `"Отменить"`, dialog disappears |
| 9 | `admin.spec.ts` | Admin user management | `Email is required and must be valid` | placeholder `"Email"`, error text `"Неверный адрес email"` on blur |
| 10 | `admin.spec.ts` | Admin user management | `Password must be at least 8 characters` | short password, button `"Сохранить"`, error text `"Пароль должен содержать не менее 8 символов"` |
| 11 | `admin.spec.ts` | Admin user management | `Passwords must match` | mismatched passwords, error text `"Пароли не совпадают"` |
| 12 | `admin.spec.ts` | Admin page access control | `Non-superuser cannot access admin page` | non-superuser redirected away from `/admin`, heading `"Пользователи"` not visible |
| 13 | `admin.spec.ts` | Admin page access control | `Superuser can access admin page` | superuser logs in, visits `/admin`, heading `"Пользователи"` visible |
| 14 | `clients.spec.ts` | Basic navigation | `Client list page loads and shows heading` | heading `"Клиенты"`, text `"Управление клиентской базой, статусами пакетов и заметками."` |
| 15 | `clients.spec.ts` | Basic navigation | `Can navigate to create client form` | button `"Добавить клиента"`, dialog heading `"Добавление клиента"`, labels: `"Имя *"`, `"Телефон *"` |
| 16 | `clients.spec.ts` | Basic navigation | `Can navigate to client detail page` | create client, click link with client name, heading with client name, text with phone number |
| 17 | `clients.spec.ts` | Dashboard | `Dashboard shows stats section` | text `"Добро пожаловать в панель управления CRM!"`, heading `"Сводка CRM"`, text `"Активные клиенты"` |
| 18 | `clients.spec.ts` | Dashboard | `Dashboard shows Today's deliveries card with a numeric value` | text `"Доставки на сегодня"`, `data-testid="todays-deliveries-value"` is numeric `>= 0` |
| 19 | `clients.spec.ts` | Package creation | `Can add a 3X package to a client` | button `"Добавить пакет"`, combobox option `"3X"`, labels: `"Кол-во дней"`, `"Цена"`, `"Дата начала"`, button `"Сохранить пакет"`, toast `"Пакет успешно добавлен"`, text `"3X пакет"` |
| 20 | `clients.spec.ts` | Package creation | `Can add a 5X package to a client` | button `"Добавить пакет"`, combobox option `"5X"`, labels: `"Кол-во дней"`, `"Цена"`, `"Дата начала"`, button `"Сохранить пакет"`, toast `"Пакет успешно добавлен"`, text `"5X пакет"` |
| 21 | `clients.spec.ts` | Delivery history | `Delivery is persisted after page reload` | button `"Подробнее"`, button `"Добавить доставку"`, labels: `"Дата питания"`, `"Дата передачи / сборки"`, button `"Сохранить доставку"`, toast `"Доставка успешно добавлена"`, text `"Дата питания: [formattedDate]"`, survives `page.reload()` |
| 22 | `clients.spec.ts` | Freeze history | `Freeze is persisted after page reload` | button `"Подробнее"`, button `"Добавить заморозку"`, labels: `"Дата начала"`, `"Дата окончания"`, button `"Сохранить заморозку"`, toast `"Заморозка успешно добавлена"`, text `"Заморожено дней: 2"`, survives `page.reload()` |
| 23 | `clients.spec.ts` | Extension history | `Extension is persisted after page reload` | button `"Подробнее"`, button `"Добавить продление"`, labels: `"Доп. дни"`, `"Доплата"`, `"Дата"`, button `"Сохранить продление"`, toast `"Продление успешно добавлено"`, text `"+5 дней (на"`, text `"Доплата: 1 900"`, survives `page.reload()` |
| 24 | `clients.spec.ts` | Partial payments / debt | `Partial payment creates debt and shows debt badge` | package price 10000, button `"Добавить оплату"`, labels: `"Сумма"`, `"Дата"`, button `"Сохранить оплату"`, toast `"Оплата успешно добавлена"`, text regex `/Долг.*7.?000/` |
| 25 | `clients.spec.ts` | Multiple packages | `Client can have multiple packages` | creates 3X and 5X packages, both `"3X пакет"` and `"5X пакет"` visible, package count badge `"2"` |
| 26 | `clients.spec.ts` | Package status | `Package status can be changed` | button `"Обновить статус"`, combobox option `"На паузе"`, button `"Сохранить статус"`, toast `"Статус пакета успешно обновлен"`, status badge `"На паузе"` |
| 27 | `clients.spec.ts` | Extension added price | `Extension with added price shows total obligation and debt correctly` | package 10 days / price 11000, extension 20 days / added_price 19000, text regex `/Общая стоимость/`, text `"30,000"`, persists across reload |
| 28 | `clients.spec.ts` | Delivery semantics | `Delivery form auto-sets send date to one day before meal date` | button `"Добавить доставку"`, labels: `"Дата питания"`, `"Дата передачи / сборки"`, filling meal date auto-populates send date to previous day |
| 29 | `clients.spec.ts` | Completed package | `Completed package cannot have new deliveries added` | 1-day package with 1 delivery transitions to `"Завершен"` on reload; subsequent delivery rejected by API |
| 30 | `clients.spec.ts` | Multiple packages | `Multiple packages history survives page reload` | creates 3X and 5X packages, both present after `page.reload()` |
| 31 | `clients.spec.ts` | Partial payments | `Three partial payments equal to full price result in zero debt` | 3 payments of 3000 on 9000 package, text regex `/Долг.*0/` |
| 32 | `clients.spec.ts` | Client notes | `Client notes persist after page reload` | tab `"Заметки"`, label `"Новая заметка"`, button `"Сохранить заметку"`, toast `"Заметка успешно добавлена"`, note text persists after reload |
| 33 | `clients.spec.ts` | Dashboard counter | `Dashboard today's deliveries count increases after adding today's delivery` | reads initial `data-testid="todays-deliveries-value"`, adds delivery for today (`sent_date = TODAY`), dashboard count increments by 1 |
| 34 | `items.spec.ts` | Routing redirect | `Items route redirects to clients` | visits `/items`, redirects to `/clients`, heading `"Клиенты"` |
| 35 | `items.spec.ts` | Routing redirect | `Redirected items route does not show legacy item UI` | button `"Добавить клиента"` visible, button `"Add Item"` count is 0 |
| 36 | `login.spec.ts` | Inputs validation | `Inputs are visible, empty and editable` | `getByTestId("email-input")`, `getByTestId("password-input")` visible and editable |
| 37 | `login.spec.ts` | UI elements | `Log In button is visible` | button `"Войти"` visible |
| 38 | `login.spec.ts` | UI elements | `Forgot Password link is visible` | link `"Забыли пароль?"` visible |
| 39 | `login.spec.ts` | Authentication | `Log in with valid email and password ` | fill valid credentials, button `"Войти"`, redirects to `/`, text `"Добро пожаловать в панель управления CRM!"` |
| 40 | `login.spec.ts` | Authentication | `Log in with invalid email` | invalid email format, error text `"Неверный адрес email"` |
| 41 | `login.spec.ts` | Authentication | `Log in with invalid password` | wrong password, error text `"Неправильный email или пароль"` |
| 42 | `login.spec.ts` | Session lifecycle | `Successful log out` | `getByTestId("user-menu")`, menuitem `"Выйти"`, redirects to `/login` |
| 43 | `login.spec.ts` | Access control | `Logged-out user cannot access protected routes` | logs out, visits `/settings`, redirects to `/login` |
| 44 | `login.spec.ts` | Access control | `Redirects to /login when token is wrong` | sets invalid token in `localStorage`, visits `/settings`, redirects to `/login` |
| 45 | `reset-password.spec.ts` | UI elements | `Password Recovery title is visible` | visits `/recover-password`, heading `"Восстановление пароля"` |
| 46 | `reset-password.spec.ts` | UI elements | `Input is visible, empty and editable` | `getByTestId("email-input")` visible and editable |
| 47 | `reset-password.spec.ts` | UI elements | `Continue button is visible` | button `"Продолжить"` visible |
| 48 | `reset-password.spec.ts` | End-to-end flow | `User can reset password successfully using the link` | signs up, requests reset, receives email in Mailpit, navigates to reset URL, fills `getByTestId("new-password-input")` and `getByTestId("confirm-password-input")`, button `"Сбросить пароль"`, toast `"Пароль успешно обновлен"`, logs in with new password |
| 49 | `reset-password.spec.ts` | Token validation | `Expired or invalid reset link` | visits `/reset-password?token=invalidtoken`, clicks `"Сбросить пароль"`, error text `"Неверный токен"` |
| 50 | `reset-password.spec.ts` | Password validation | `Weak new password validation` | weak password ("123"), error text `"Пароль должен содержать не менее 8 символов"` |
| 51 | `sign-up.spec.ts` | UI elements | `Inputs are visible, empty and editable` | `getByTestId("full-name-input")`, `getByTestId("email-input")`, `getByTestId("password-input")`, `getByTestId("confirm-password-input")` |
| 52 | `sign-up.spec.ts` | UI elements | `Sign Up button is visible` | button `"Зарегистрироваться"` visible |
| 53 | `sign-up.spec.ts` | UI elements | `Log In link is visible` | link `"Войти"` visible |
| 54 | `sign-up.spec.ts` | Registration | `Sign up with valid name, email, and password` | fills form, clicks `"Зарегистрироваться"`, redirects to `/login` |
| 55 | `sign-up.spec.ts` | Form validation | `Sign up with invalid email` | invalid email, error text `"Неверный адрес email"` |
| 56 | `sign-up.spec.ts` | Form validation | `Sign up with existing email` | duplicate email, error text `"The user with this email already exists in the system"` |
| 57 | `sign-up.spec.ts` | Form validation | `Sign up with weak password` | weak password, error text `"Пароль должен содержать не менее 8 символов"` |
| 58 | `sign-up.spec.ts` | Form validation | `Sign up with mismatched passwords` | mismatched passwords, error text `"Пароли не совпадают"` |
| 59 | `sign-up.spec.ts` | Form validation | `Sign up with missing full name` | empty name, error text `"ФИО обязательно"` |
| 60 | `sign-up.spec.ts` | Form validation | `Sign up with missing email` | empty email, error text `"Неверный адрес email"` |
| 61 | `sign-up.spec.ts` | Form validation | `Sign up with missing password` | empty password, error text `"Пароль обязателен"` |
| 62 | `user-settings.spec.ts` | Navigation tabs | `My profile tab is active by default` | tab `"Мой профиль"` has `aria-selected="true"` |
| 63 | `user-settings.spec.ts` | Navigation tabs | `All tabs are visible` | tabs: `"Мой профиль"`, `"Пароль"`, `"Опасная зона"` |
| 64 | `user-settings.spec.ts` | Edit profile | `Edit user name with a valid name` | tab `"Мой профиль"`, button `"Редактировать"`, label `"ФИО"`, button `"Сохранить"`, toast `"Данные пользователя успешно обновлены"`, form contains updated name |
| 65 | `user-settings.spec.ts` | Edit profile | `Edit user email with an invalid email shows error` | button `"Редактировать"`, empty label `"Email"`, blur, error text `"Неверный адрес email"` |
| 66 | `user-settings.spec.ts` | Edit profile | `Edit user email with a valid email` | button `"Редактировать"`, label `"Email"`, button `"Сохранить"`, toast `"Данные пользователя успешно обновлены"` |
| 67 | `user-settings.spec.ts` | Cancel edit | `Cancel edit action restores original name` | button `"Редактировать"`, edit name, button `"Отменить"`, restores original name |
| 68 | `user-settings.spec.ts` | Cancel edit | `Cancel edit action restores original email` | button `"Редактировать"`, edit email, button `"Отменить"`, restores original email |
| 69 | `user-settings.spec.ts` | Change password | `Update password successfully` | tab `"Пароль"`, `getByTestId("current-password-input")`, `getByTestId("new-password-input")`, `getByTestId("confirm-password-input")`, button `"Обновить пароль"`, toast `"Пароль успешно обновлен"` |
| 70 | `user-settings.spec.ts` | Change password validation | `Update password with weak passwords` | weak password, error text `"Пароль должен содержать не менее 8 символов"` |
| 71 | `user-settings.spec.ts` | Change password validation | `New password and confirmation password do not match` | mismatched passwords, error text `"Пароли не совпадают"` |
| 72 | `user-settings.spec.ts` | Change password validation | `Current password and new password are the same` | identical current & new password, API error text `"New password cannot be the same as the current one"` |
| 73 | `user-settings.spec.ts` | Theme switching | `Appearance button is visible in sidebar` | visits `/settings`, `getByTestId("theme-button")` visible in sidebar |
| 74 | `user-settings.spec.ts` | Theme switching | `User can switch between theme modes` | `getByTestId("theme-button")`, `getByTestId("dark-mode")` toggles class `dark` on `html`, `getByTestId("light-mode")` toggles class `light` |
| 75 | `user-settings.spec.ts` | Theme switching | `Selected mode is preserved across sessions` | switches mode, logs out, logs in, checks theme persistence on `html` element |

---

## 2. Master Selector Registry (MUST BE PRESERVED)

### 2.1 Critical `data-testid` Attributes

| `data-testid` | Location / Component | Purpose in Playwright Tests |
|---|---|---|
| `todays-deliveries-value` | `frontend/src/routes/_layout/index.tsx` (Dashboard Hero Card) | Tested in `clients.spec.ts` (test 18, 33) to verify today's delivery count and its numeric increment |
| `email-input` | `routes/login.tsx`, `routes/signup.tsx`, `routes/recover-password.tsx` | Used across `auth.setup.ts`, `login.spec.ts`, `sign-up.spec.ts`, `reset-password.spec.ts`, `user.ts` helper |
| `password-input` | `routes/login.tsx`, `routes/signup.tsx` | Used across `auth.setup.ts`, `login.spec.ts`, `sign-up.spec.ts`, `user.ts` helper |
| `full-name-input` | `routes/signup.tsx` | Used in `sign-up.spec.ts` and `user.ts` helper |
| `confirm-password-input` | `routes/signup.tsx`, `routes/reset-password.tsx`, `components/UserSettings/ChangePassword.tsx` | Used in `sign-up.spec.ts`, `reset-password.spec.ts`, `user-settings.spec.ts`, `user.ts` helper |
| `new-password-input` | `routes/reset-password.tsx`, `components/UserSettings/ChangePassword.tsx` | Used in `reset-password.spec.ts`, `user-settings.spec.ts` |
| `current-password-input` | `components/UserSettings/ChangePassword.tsx` | Used in `user-settings.spec.ts` |
| `user-menu` | `components/Sidebar/User.tsx` | Used in `login.spec.ts` and `utils/user.ts` (`logOutUser`) |
| `theme-button` | `components/Common/Appearance.tsx` | Used in `user-settings.spec.ts` (tests 73, 74, 75) |
| `light-mode` | `components/Common/Appearance.tsx` | Used in `user-settings.spec.ts` |
| `dark-mode` | `components/Common/Appearance.tsx` | Used in `user-settings.spec.ts` |

---

### 2.2 Button Text (Role `button`, name: "...")

| Russian Button Text | Location | Tests Relying on This Exact String |
|---|---|---|
| `"Войти"` | `routes/login.tsx` | `auth.setup.ts`, `login.spec.ts`, `utils/user.ts` |
| `"Зарегистрироваться"` | `routes/signup.tsx` | `sign-up.spec.ts`, `utils/user.ts` |
| `"Добавить клиента"` | `routes/clients.tsx`, `routes/_layout/items.tsx` | `clients.spec.ts`, `items.spec.ts` |
| `"Добавить пользователя"` | `components/Admin/AddUser.tsx` | `admin.spec.ts` |
| `"Сохранить"` | `AddClientDialog`, `AddUser`, `EditUser`, `UserInformation` | `admin.spec.ts`, `clients.spec.ts`, `user-settings.spec.ts` |
| `"Отменить"` / `"Отмена"` | `AddUser`, `UserInformation` (Note: `admin.spec.ts` checks `"Отменить"`) | `admin.spec.ts`, `user-settings.spec.ts` |
| `"Удалить"` | `DeleteUser.tsx` (Dialog confirm button) | `admin.spec.ts` |
| `"Редактировать"` | `UserInformation.tsx` | `user-settings.spec.ts` |
| `"Добавить пакет"` | `AddPackageDialog.tsx` | `clients.spec.ts` |
| `"Сохранить пакет"` | `AddPackageDialog.tsx` | `clients.spec.ts` |
| `"Подробнее"` | `PackageCard.tsx` (Expand/Collapse) | `clients.spec.ts` |
| `"Добавить доставку"` | `PackageCard.tsx` (`AddDeliveryDialog`) | `clients.spec.ts` |
| `"Сохранить доставку"` | `PackageCard.tsx` (`AddDeliveryDialog`) | `clients.spec.ts` |
| `"Добавить заморозку"` | `PackageCard.tsx` (`AddFreezeDialog`) | `clients.spec.ts` |
| `"Сохранить заморозку"` | `PackageCard.tsx` (`AddFreezeDialog`) | `clients.spec.ts` |
| `"Добавить продление"` | `PackageCard.tsx` (`AddExtensionDialog`) | `clients.spec.ts` |
| `"Сохранить продление"` | `PackageCard.tsx` (`AddExtensionDialog`) | `clients.spec.ts` |
| `"Добавить оплату"` | `PackageCard.tsx` (`AddPaymentDialog`) | `clients.spec.ts` |
| `"Сохранить оплату"` | `PackageCard.tsx` (`AddPaymentDialog`) | `clients.spec.ts` |
| `"Обновить статус"` | `PackageCard.tsx` (`UpdatePackageStatusDialog`) | `clients.spec.ts` |
| `"Сохранить статус"` | `PackageCard.tsx` (`UpdatePackageStatusDialog`) | `clients.spec.ts` |
| `"Сохранить заметку"` | `AddNoteForm.tsx` | `clients.spec.ts` |
| `"Обновить пароль"` | `ChangePassword.tsx` | `user-settings.spec.ts` |
| `"Сбросить пароль"` | `routes/reset-password.tsx` | `reset-password.spec.ts` |
| `"Продолжить"` | `routes/recover-password.tsx` | `reset-password.spec.ts` |

---

### 2.3 Form Labels (`getByLabel("...")`)

| Label String | Context / Form | Test Usage |
|---|---|---|
| `"Имя *"` | `AddClientDialog` | `clients.spec.ts` (`createClient`, create client form) |
| `"Телефон *"` | `AddClientDialog` | `clients.spec.ts` (`createClient`, create client form) |
| `"Администратор?"` | `AddUser.tsx` | `admin.spec.ts` |
| `"Активен?"` | `AddUser.tsx` | `admin.spec.ts` |
| `"Кол-во дней"` | `AddPackageDialog.tsx` | `clients.spec.ts` (3X, 5X package creation) |
| `"Цена"` | `AddPackageDialog.tsx` | `clients.spec.ts` (3X, 5X package creation) |
| `"Дата начала"` | `AddPackageDialog.tsx`, `AddFreezeDialog.tsx` | `clients.spec.ts` (packages, freezes) |
| `"Дата питания"` | `AddDeliveryDialog.tsx` | `clients.spec.ts` (deliveries) |
| `"Дата передачи / сборки"` | `AddDeliveryDialog.tsx` | `clients.spec.ts` (deliveries) |
| `"Дата окончания"` | `AddFreezeDialog.tsx` | `clients.spec.ts` (freezes) |
| `"Доп. дни"` | `AddExtensionDialog.tsx` | `clients.spec.ts` (extensions) |
| `"Доплата"` | `AddExtensionDialog.tsx` | `clients.spec.ts` (extensions) |
| `"Дата"` | `AddExtensionDialog.tsx`, `AddPaymentDialog.tsx` | `clients.spec.ts` (extensions, payments) |
| `"Сумма"` | `AddPaymentDialog.tsx` | `clients.spec.ts` (payments) |
| `"Новая заметка"` | `AddNoteForm.tsx` (or tab) | `clients.spec.ts` (notes) |
| `"ФИО"` | `UserInformation.tsx` | `user-settings.spec.ts` |
| `"Email"` | `UserInformation.tsx` | `user-settings.spec.ts` |

---

### 2.4 Placeholders (`getByPlaceholder("...")`)

| Placeholder String | Context / Input | Test Usage |
|---|---|---|
| `"Email"` | `AddUser.tsx`, `EditUser.tsx` | `admin.spec.ts` |
| `"ФИО"` | `AddUser.tsx`, `EditUser.tsx` | `admin.spec.ts` |
| `"Пароль"` | `AddUser.tsx`, `EditUser.tsx` | `admin.spec.ts` (matched with `.first()` and `.last()`) |

---

### 2.5 Dialog Titles & Headings (`getByRole("heading", { name: "..." })`)

| Heading / Dialog Title | Component / Page | Test Usage |
|---|---|---|
| `"Пользователи"` | `routes/_layout/admin.tsx` | `admin.spec.ts` |
| `"Клиенты"` | `routes/_layout/clients.tsx` | `clients.spec.ts`, `items.spec.ts` |
| `"Сводка CRM"` | `routes/_layout/index.tsx` | `clients.spec.ts` |
| `"Добавление клиента"` | `AddClientDialog` | `clients.spec.ts` |
| `"Восстановление пароля"` | `routes/recover-password.tsx` | `reset-password.spec.ts` |

---

### 2.6 Navigation Tabs (`getByRole("tab", { name: "..." })`)

| Tab Name | Page | Test Usage |
|---|---|---|
| `"Мой профиль"` | `routes/_layout/settings.tsx` | `user-settings.spec.ts` |
| `"Пароль"` | `routes/_layout/settings.tsx` | `user-settings.spec.ts` |
| `"Опасная зона"` | `routes/_layout/settings.tsx` | `user-settings.spec.ts` |
| `"Заметки"` | `routes/_layout/clients.$clientId.tsx` | `clients.spec.ts` |

---

### 2.7 Key Toast Notifications & Exact Strings

| Toast / String | Trigger Action | Test Usage |
|---|---|---|
| `"Добро пожаловать в панель управления CRM!"` | Dashboard load / Login success | `auth.setup.ts`, `login.spec.ts`, `clients.spec.ts`, `utils/user.ts` |
| `"Управление клиентской базой, статусами пакетов и заметками."` | Client list subtitle | `clients.spec.ts` |
| `"Управление пользователями и правами доступа"` | Admin page subtitle | `admin.spec.ts` |
| `"Пользователь успешно создан"` | Admin creates user | `admin.spec.ts` |
| `"Пользователь успешно обновлен"` | Admin updates user | `admin.spec.ts` |
| `"Пользователь успешно удален"` | Admin deletes user | `admin.spec.ts` |
| `"Клиент успешно добавлен"` | Create client | `clients.spec.ts` |
| `"Пакет успешно добавлен"` | Add package | `clients.spec.ts` |
| `"Доставка успешно добавлена"` | Add delivery | `clients.spec.ts` |
| `"Заморозка успешно добавлена"` | Add freeze | `clients.spec.ts` |
| `"Продление успешно добавлено"` | Add extension | `clients.spec.ts` |
| `"Оплата успешно добавлена"` | Add payment | `clients.spec.ts` |
| `"Статус пакета успешно обновлен"` | Update package status | `clients.spec.ts` |
| `"Заметка успешно добавлена"` | Add note | `clients.spec.ts` |
| `"Данные пользователя успешно обновлены"` | Update profile info | `user-settings.spec.ts` |
| `"Пароль успешно обновлен"` | Change/reset password | `user-settings.spec.ts`, `reset-password.spec.ts` |
| `"3X пакет"`, `"5X пакет"` | Package card title | `clients.spec.ts` |
| `"Заморожено дней: 2"` | Package freeze counter | `clients.spec.ts` |
| `"+5 дней (на"` | Package extension list item | `clients.spec.ts` |
| `"Доплата: 1 900"` | Extension price label | `clients.spec.ts` |
| `"Дата питания: [en-US formatted date]"` | Delivery card item | `clients.spec.ts` |
| `/Долг.*7.?000/`, `/Долг.*0/` | Debt badge | `clients.spec.ts` |
| `"Общая стоимость"`, `"30,000"` | Package total obligation | `clients.spec.ts` |
| `"Завершен"` | Completed package badge | `clients.spec.ts` |
| `"Неверный адрес email"` | Form validation error | `admin.spec.ts`, `login.spec.ts`, `sign-up.spec.ts`, `user-settings.spec.ts` |
| `"Пароль должен содержать не менее 8 символов"` | Password length validation | `admin.spec.ts`, `reset-password.spec.ts`, `sign-up.spec.ts`, `user-settings.spec.ts` |
| `"Пароли не совпадают"` | Password match validation | `admin.spec.ts`, `sign-up.spec.ts`, `user-settings.spec.ts` |
| `"Неправильный email или пароль"` | Login failure | `login.spec.ts` |
| `"The user with this email already exists in the system"` | Duplicate signup | `sign-up.spec.ts` |
| `"New password cannot be the same as the current one"` | Identical password update | `user-settings.spec.ts` |
| `"Неверный токен"` | Invalid password reset token | `reset-password.spec.ts` |
| `"ФИО обязательно"` | Missing name validation | `sign-up.spec.ts` |
| `"Пароль обязателен"` | Missing password validation | `sign-up.spec.ts` |

---

## 3. Test Helpers and Utility Architecture (`tests/utils/`)

### 3.1 `tests/utils/user.ts`
- **`signUpNewUser(page, name, email, password)`**:
  1. `page.goto("/signup")`
  2. Fills `getByTestId("full-name-input")`, `getByTestId("email-input")`, `getByTestId("password-input")`, `getByTestId("confirm-password-input")`
  3. Clicks `getByRole("button", { name: "Зарегистрироваться" })`
  4. Navigates to `/login`
- **`logInUser(page, email, password)`**:
  1. `page.goto("/login")`
  2. Fills `getByTestId("email-input")`, `getByTestId("password-input")`
  3. Clicks `getByRole("button", { name: "Войти" })`
  4. Expects URL to match `/\/$/`
  5. Expects `page.getByText("Добро пожаловать в панель управления CRM!")` to be visible
- **`logOutUser(page)`**:
  1. Clicks `getByTestId("user-menu")`
  2. Clicks `getByRole("menuitem", { name: "Выйти" })`
  3. Navigates to `/login`

### 3.2 `tests/utils/privateApi.ts`
- Direct HTTP client helper calling `PrivateService.createUser({ body: { email, password, is_verified: true, full_name: "Test User" } })` against `${process.env.VITE_API_URL}`.
- Used in tests to create fresh verified users instantly without navigating through the UI signup and email verification flow.

### 3.3 `tests/utils/mailpit.ts`
- Interacts with Mailpit REST API at `${process.env.MAILPIT_HOST}/api/v1/search`.
- Polls for incoming emails matching search criteria (`to:${email}`) with a 5000ms timeout.
- Constructs HTML preview URLs (`${process.env.MAILPIT_HOST}/view/${email.ID}.html`) where Playwright can inspect links like `a[href*="/reset-password?token="]`.

### 3.4 `tests/utils/random.ts`
- Provides pseudo-random data generators: `randomEmail()`, `randomPassword()`, `randomTeamName()`, `randomItemTitle()`, `randomItemDescription()`, `slugify()`.

---

## 4. Test Execution, Docker Configurations, and Concurrency Limits

### 4.1 Test Execution Commands

```bash
# 1. Start application dependencies (Database, Mailpit, Backend serving frontend)
docker compose up -d db mailpit backend

# 2. Run Playwright tests on host (against backend at localhost:8000 or Vite dev server)
cd frontend
npx playwright test

# Or run tests sequentially to avoid parallel resource saturation:
npx playwright test --workers=1

# Or run a specific spec file:
npx playwright test tests/clients.spec.ts

# 3. Run Playwright in Docker container:
docker compose run --rm playwright bun run test

# 4. Run backend unit & integration tests:
docker compose exec -T backend bash scripts/tests-start.sh
```

### 4.2 Playwright Configuration (`playwright.config.ts`) Analysis

- **`fullyParallel: true`**: Files and tests are executed concurrently.
- **`projects`**:
  - `setup`: runs `auth.setup.ts` to log in as superuser and create `playwright/.auth/user.json`.
  - `chromium`: depends on `setup`, uses saved `storageState`.
- **`webServer`**:
  - Starts `npm run dev` if `PLAYWRIGHT_BASE_URL` is undefined.
  - When `PLAYWRIGHT_BASE_URL` is provided (e.g. `http://backend:8000`), webServer is bypassed.

### 4.3 Identified Failure Modes and Concurrency Risks

1. **Vite Dev Server Resource Limits in Parallel Mode**:
   - Spawning 8–16 browser workers simultaneously against `npm run dev` can saturate Node.js / Vite build threads, leading to `ERR_CONNECTION_REFUSED` or timeout errors.
   - *Acceptance criterion per ORIGINAL_REQUEST.md*: At least 50 of 75 tests passing is acceptable if failures are due to connection timeouts in parallel mode, but **zero failures may be caused by selector mismatches**.
2. **Dashboard Counter Race Conditions (Tests 18 & 33)**:
   - `clients.spec.ts` (test 33) checks that `todays-deliveries-value` increments by exactly +1 after adding a delivery with `sent_date = TODAY`.
   - If multiple parallel tests insert deliveries with `sent_date = TODAY` simultaneously into the shared PostgreSQL database, test 33 can experience intermittent count discrepancies.
3. **Mailpit Notification Delay**:
   - `reset-password.spec.ts` has a hard 5-second deadline. If SMTP message processing takes >5s under heavy CPU load, the test times out.
4. **Button & Dialog Text Inconsistencies (Known UI Defect Found)**:
   - In `frontend/src/components/Admin/DeleteUser.tsx`, the dialog buttons were `"Cancel"` and `"Delete"`, but `admin.spec.ts` expects `"Удалить"` and `"Отменить"`.
   - In `frontend/src/components/Admin/EditUser.tsx`, the dialog buttons were `"Cancel"` and `"Save"`, but `admin.spec.ts` expects `"Сохранить"` and `"Отменить"`.
   - All modal submit and cancel buttons must be strictly translated to Russian as required by R5.

---

## 5. Architectural Recommendations for Redesign (R1–R5)

1. **Preserve Exact Russian Strings**: Any change to button text, modal titles, form labels, or toast messages will break E2E assertions.
2. **Preserve Element Structure**:
   - Keep `data-testid="todays-deliveries-value"` on the number display inside the Dashboard's hero delivery card.
   - Keep `data-testid="user-menu"` on the sidebar user avatar trigger.
   - Keep `data-testid="theme-button"`, `light-mode`, and `dark-mode` on the theme toggler.
3. **Preserve Subtitle / Welcome Text**:
   - `"Добро пожаловать в панель управления CRM!"` on Dashboard and in auth login assertions.
   - `"Сводка CRM"` heading on Dashboard.
4. **Form Compatibility**:
   - Retain `Имя *` and `Телефон *` labels on `AddClientDialog`.
   - Retain 3X / 5X option values in meal type select.
   - Ensure the automated calculation of `sent_date` (1 day before `scheduled_date`) remains active in delivery creation dialogs.
