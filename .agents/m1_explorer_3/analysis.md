# Milestone 1 Investigation: Admin Components & Test Compatibility

**Agent:** m1_explorer_3  
**Date:** 2026-08-27  
**Scope:** Admin Management Routes & Components, Role Badges, Form Labels, Button Translations, Playwright Test Compatibility (`frontend/tests/admin.spec.ts` and related test suites)

---

## 1. Executive Summary

Milestone 1 focuses on design system foundations, branded global navigation shell, authentication flow compatibility, and admin/settings user management interfaces.

During the codebase investigation of the Admin components (`frontend/src/routes/_layout/admin.tsx`, `frontend/src/components/Admin/*`) and the associated E2E test suite (`frontend/tests/admin.spec.ts`), we identified several **critical translation defects** where English action strings directly cause Playwright E2E test failures.

### Key Discoveries:
1. **Critical Test Blockers in Admin Components:**
   - In `frontend/src/components/Admin/EditUser.tsx`:
     - Line 229: `<LoadingButton type="submit">Save</LoadingButton>` uses English `"Save"`. `admin.spec.ts` (line 95) asserts `page.getByRole("button", { name: "Сохранить" })`. This causes `Edit a user successfully` test to fail.
     - Line 225: `<Button variant="outline">Cancel</Button>` uses English `"Cancel"`. Must be `"Отменить"`.
   - In `frontend/src/components/Admin/DeleteUser.tsx`:
     - Line 86: `<LoadingButton variant="destructive">Delete</LoadingButton>` uses English `"Delete"`. `admin.spec.ts` (line 121) asserts `page.getByRole("button", { name: "Удалить" })`. This causes `Delete a user successfully` test to fail.
     - Line 78: `<Button variant="outline">Cancel</Button>` uses English `"Cancel"`. Must be `"Отменить"`.
2. **Untranslated Badges & Table Headers:**
   - In `frontend/src/components/Admin/columns.tsx`:
     - Line 27: Current user badge displays English `<Badge variant="outline">You</Badge>`. Must be `"Вы"`.
     - Line 69: Actions header is `<span className="sr-only">Actions</span>`. Recommended: `"Действия"`.
   - In `frontend/src/components/Pending/PendingUsers.tsx`:
     - Skeleton table headers are in English (`"Full Name"`, `"Email"`, `"Role"`, `"Status"`, `"Actions"`). Must match Russian column headers (`"ФИО"`, `"Email"`, `"Роль"`, `"Статус"`, `"Действия"`).
3. **Related Untranslated Elements in M1 Scope:**
   - In `frontend/src/components/UserSettings/DeleteConfirmation.tsx`: Trigger button `"Delete Account"` -> `"Удалить аккаунт"`, `"Cancel"` -> `"Отменить"`, `"Delete"` -> `"Удалить"`.
   - In `frontend/src/components/Common/DataTable.tsx`: Empty state `"No results found."` -> `"Результаты не найдены"`, pagination string `"Showing X to Y of Z entries"` -> `"Показано X–Y из Z записей"`, `"Rows per page"` -> `"Строк на странице"`, `"Page X of Y"` -> `"Страница X из Y"`.
   - In `frontend/src/components/Common/Appearance.tsx`: Tooltip/text `"Appearance"` -> `"Тема оформления"`, `"Light"` -> `"Светлая"`, `"Dark"` -> `"Тёмная"`, `"System"` -> `"Системная"` (preserving `data-testid="theme-button"`, `data-testid="light-mode"`, `data-testid="dark-mode"`).
   - In `frontend/src/components/Common/ErrorComponent.tsx` and `NotFound.tsx`: Standard Russian error messages.

---

## 2. Component-by-Component Deep Dive

### 2.1 Admin Route (`frontend/src/routes/_layout/admin.tsx`)
- **Route Definition:** `/_layout/admin`
- **Access Guard:** `beforeLoad` checks `user.is_superuser`. If not superuser, redirects to `/`. Tested by `admin.spec.ts` ("Non-superuser cannot access admin page", "Superuser can access admin page").
- **Page Headings:**
  - `<h1>Пользователи</h1>` (line 64) — Checked by `page.getByRole("heading", { name: "Пользователи" })`.
  - `<p>Управление пользователями и правами доступа</p>` (line 66) — Checked by `page.getByText("Управление пользователями и правами доступа")`.
- **Top Actions:** Contains `<AddUser />` modal trigger button.
- **Table Data Feeding:** Fetches users via `UsersService.readUsers({ query: { skip: 0, limit: 100 } })`, maps each record adding `isCurrentUser: currentUser?.id === user.id`, and renders `<DataTable columns={columns} data={tableData} />` inside `<Suspense fallback={<PendingUsers />}>`.

### 2.2 Add User Dialog (`frontend/src/components/Admin/AddUser.tsx`)
- **Status:** Fully translated and conformant.
- **Trigger Button (line 96):** `<Button className="my-4"><Plus className="mr-2" />Добавить пользователя</Button>` — Matched by `page.getByRole("button", { name: "Добавить пользователя" })`.
- **Dialog Header:**
  - Title: `"Добавить пользователя"`
  - Description: `"Заполните форму ниже для добавления нового пользователя в систему."`
- **Form Controls & Validation:**
  - `email`: FormLabel `"Email *"`, placeholder `"Email"`, schema validation `"Неверный адрес email"`. Tested by `getByPlaceholder("Email")`.
  - `full_name`: FormLabel `"ФИО"`, placeholder `"ФИО"`. Tested by `getByPlaceholder("ФИО")`.
  - `password`: FormLabel `"Задать пароль *"`, placeholder `"Пароль"`, validation `"Пароль обязателен"`, `"Пароль должен содержать не менее 8 символов"`. Tested by `getByPlaceholder("Пароль").first()`.
  - `confirm_password`: FormLabel `"Подтвердить пароль *"`, placeholder `"Пароль"`, validation `"Пожалуйста, подтвердите пароль"`, `"Пароли не совпадают"`. Tested by `getByPlaceholder("Пароль").last()`.
  - `is_superuser`: Checkbox with FormLabel `"Администратор?"`. Tested by `page.getByLabel("Администратор?").check()`.
  - `is_active`: Checkbox with FormLabel `"Активен?"`. Tested by `page.getByLabel("Активен?").check()`.
- **Footer Buttons:**
  - Cancel (line 223): `<Button variant="outline">Отменить</Button>`. Tested by `page.getByRole("button", { name: "Отменить" })`.
  - Submit (line 227): `<LoadingButton type="submit">Сохранить</LoadingButton>`. Tested by `page.getByRole("button", { name: "Сохранить" })`.
- **Mutation & Feedback:**
  - Toast: `"Пользователь успешно создан"`. Tested by `expect(page.getByText("Пользователь успешно создан")).toBeVisible()`.
  - On settlement: invalidates `["users"]` query.

### 2.3 Edit User Dialog (`frontend/src/components/Admin/EditUser.tsx`)
- **Trigger Menu Item (line 106):** `<DropdownMenuItem><Pencil />Редактировать</DropdownMenuItem>`. Tested by `page.getByRole("menuitem", { name: "Редактировать" })`.
- **Dialog Header:** Title `"Редактировать"`, description `"Обновите данные пользователя ниже."`.
- **Form Controls:**
  - `email`: FormLabel `"Email *"`, placeholder `"Email"`.
  - `full_name`: FormLabel `"ФИО"`, placeholder `"ФИО"`.
  - `password`: FormLabel `"Задать пароль"`, placeholder `"Пароль"`.
  - `confirm_password`: FormLabel `"Подтвердите пароль"`, placeholder `"Пароль"`.
  - `is_superuser`: FormLabel `"Администратор?"`.
  - `is_active`: FormLabel `"Активен?"`.
- **Footer Buttons (DEFECT FOUND):**
  - Line 225: `<Button variant="outline">Cancel</Button>` ❌ -> MUST BE `"Отменить"` ✅.
  - Line 229: `<LoadingButton type="submit">Save</LoadingButton>` ❌ -> MUST BE `"Сохранить"` ✅.
  - **Impact:** In `admin.spec.ts` (line 95), `await page.getByRole("button", { name: "Сохранить" }).click()` fails with timeout waiting for selector because button text is `"Save"`.
- **Toast:** `"Пользователь успешно обновлен"`. Tested by `expect(page.getByText("Пользователь успешно обновлен")).toBeVisible()`.

### 2.4 Delete User Dialog (`frontend/src/components/Admin/DeleteUser.tsx`)
- **Trigger Menu Item (line 62):** `<DropdownMenuItem variant="destructive"><Trash2 />Удалить</DropdownMenuItem>`. Tested by `page.getByRole("menuitem", { name: "Удалить" })`.
- **Dialog Header:** Title `"Удалить"`, description `"Все элементы, связанные с этим пользователем, также будут безвозвратно удалены. Вы уверены? Вы не сможете отменить это действие."`.
- **Footer Buttons (DEFECT FOUND):**
  - Line 78: `<Button variant="outline">Cancel</Button>` ❌ -> MUST BE `"Отменить"` ✅.
  - Line 86: `<LoadingButton variant="destructive">Delete</LoadingButton>` ❌ -> MUST BE `"Удалить"` ✅.
  - **Impact:** In `admin.spec.ts` (line 121), `await page.getByRole("button", { name: "Удалить" }).click()` fails because button text is `"Delete"`.
- **Toast:** `"Пользователь успешно удален"`. Tested by `expect(page.getByText("Пользователь успешно удален")).toBeVisible()`.

### 2.5 Table Columns & Badges (`frontend/src/components/Admin/columns.tsx`)
- **FIO Column:**
  - Header: `"ФИО"`
  - Cell: Displays full name or `"N/A"`.
  - Current User Indicator (line 27): `<Badge variant="outline" className="text-xs">You</Badge>` ❌ -> MUST BE `"Вы"` ✅.
- **Email Column:** Header: `"Email"`.
- **Role Column (Badges):**
  - Header: `"Роль"`
  - Superuser: `<Badge variant="default">Администратор</Badge>` (Tested in `admin.spec.ts` line 67).
  - Regular User: `<Badge variant="secondary">Пользователь</Badge>`.
  - Emerald Design System Alignment: `variant="default"` leverages the primary emerald palette (`oklch(0.54 0.15 156)`), while `secondary` provides a muted slate contrast.
- **Status Column (Badges & Dots):**
  - Header: `"Статус"`
  - Active: Green dot (`bg-green-500` / `bg-emerald-500`) + `"Активен"`.
  - Inactive: Gray dot (`bg-gray-400` / `bg-muted-foreground`) + `"Неактивен"`.
- **Actions Column:**
  - Header: `<span className="sr-only">Actions</span>` -> Can be translated to `"Действия"`.
  - Cell: `<UserActionsMenu user={row.original} />` (omitted for the current logged-in user row).

### 2.6 User Actions Menu (`frontend/src/components/Admin/UserActionsMenu.tsx`)
- Trigger button: `<Button variant="ghost" size="icon"><EllipsisVertical /></Button>` (tested via `userRow.getByRole("button")`).
- Dropdown content: Mounts `EditUser` and `DeleteUser`.
- Closes menu automatically on modal open/action success.

### 2.7 Skeleton Loader (`frontend/src/components/Pending/PendingUsers.tsx`)
- Current TableHead headers:
  - `<TableHead>Full Name</TableHead>` ❌ -> `<TableHead>ФИО</TableHead>` ✅
  - `<TableHead>Email</TableHead>` ✅
  - `<TableHead>Role</TableHead>` ❌ -> `<TableHead>Роль</TableHead>` ✅
  - `<TableHead>Status</TableHead>` ❌ -> `<TableHead>Статус</TableHead>` ✅
  - `<TableHead><span className="sr-only">Actions</span></TableHead>` ❌ -> `<TableHead><span className="sr-only">Действия</span></TableHead>` ✅

---

## 3. Comprehensive Translation & Selector Matrix

The following table maps every UI string in the Admin and related M1 components, highlighting current values, target translations, and test impact:

| Component File | Location / Element | Current Text | Required Russian Text | Test / Selector Dependency |
|---|---|---|---|---|
| `EditUser.tsx` | Line 229 (Submit) | `"Save"` | **`"Сохранить"`** | **Critical:** `admin.spec.ts` line 95 (`getByRole("button", { name: "Сохранить" })`) |
| `EditUser.tsx` | Line 225 (Cancel) | `"Cancel"` | **`"Отменить"`** | Consistency with UI & tests |
| `DeleteUser.tsx` | Line 86 (Submit) | `"Delete"` | **`"Удалить"`** | **Critical:** `admin.spec.ts` line 121 (`getByRole("button", { name: "Удалить" })`) |
| `DeleteUser.tsx` | Line 78 (Cancel) | `"Cancel"` | **`"Отменить"`** | Consistency with UI & tests |
| `columns.tsx` | Line 27 (Current user badge) | `"You"` | **`"Вы"`** | UI Russian locale requirement |
| `columns.tsx` | Line 69 (Actions header) | `"Actions"` (sr-only) | **`"Действия"`** | Accessibility / A11y |
| `PendingUsers.tsx` | Lines 15–21 (Table headers) | `"Full Name"`, `"Role"`, `"Status"` | **`"ФИО"`, `"Роль"`, `"Статус"`** | Skeleton UI consistency |
| `DeleteConfirmation.tsx` | Line 47 (Trigger) | `"Delete Account"` | **`"Удалить аккаунт"`** | Settings / Danger zone |
| `DeleteConfirmation.tsx` | Line 65 (Cancel) | `"Cancel"` | **`"Отменить"`** | User settings modal |
| `DeleteConfirmation.tsx` | Line 73 (Submit) | `"Delete"` | **`"Удалить"`** | User settings modal |
| `DataTable.tsx` | Line 86 (Empty state) | `"No results found."` | **`"Результаты не найдены"`** | Data table empty state |
| `DataTable.tsx` | Line 97 (Pagination) | `"Showing X to Y of Z entries"` | **`"Показано X–Y из Z записей"`** | Data table pagination info |
| `DataTable.tsx` | Line 112 (Page size) | `"Rows per page"` | **`"Строк на странице"`** | Data table page size select |
| `DataTable.tsx` | Line 137 (Page number) | `"Page X of Y"` | **`"Страница X из Y"`** | Data table page count |
| `Appearance.tsx` | Lines 34–38, 51–62 | `"Appearance"`, `"Light"`, `"Dark"`, `"System"` | **`"Тема оформления"`, `"Светлая"`, `"Тёмная"`, `"Системная"`** | Preserving testids (`theme-button`, `light-mode`, `dark-mode`) |
| `ErrorComponent.tsx` | Lines 13–24 | `"Error"`, `"Oops!"`, `"Something went wrong..."`, `"Go Home"` | **`"Ошибка"`, `"Упс!"`, `"Что-то пошло не так..."`, `"На главную"`** | Error fallback page |
| `NotFound.tsx` | Lines 15–25 | `"Oops!"`, `"The page you are looking for..."`, `"Go Back"` | **`"Упс!"`, `"Запрашиваемая страница не найдена."`, `"На главную"`** | 404 page |

---

## 4. Playwright Test Suite Analysis (`admin.spec.ts`)

`frontend/tests/admin.spec.ts` contains 12 Playwright test cases. Here is the verification trace for each test against the UI components:

1. **`Admin page is accessible and shows correct title`**
   - Navigates to `/admin`
   - Verifies `page.getByRole("heading", { name: "Пользователи" })` (`admin.tsx` line 64: `<h1>Пользователи</h1>`)
   - Verifies `page.getByText("Управление пользователями и правами доступа")` (`admin.tsx` line 66)
   - **Verdict:** Passes.

2. **`Add User button is visible`**
   - Verifies `page.getByRole("button", { name: "Добавить пользователя" })` (`AddUser.tsx` line 96)
   - **Verdict:** Passes.

3. **`Create a new user successfully`**
   - Clicks `"Добавить пользователя"`
   - Fills `getByPlaceholder("Email")`, `getByPlaceholder("ФИО")`, `getByPlaceholder("Пароль").first()`, `getByPlaceholder("Пароль").last()`
   - Clicks `getByRole("button", { name: "Сохранить" })`
   - Expects `getByText("Пользователь успешно создан")`
   - Expects dialog closed and row visible
   - **Verdict:** Passes.

4. **`Create a superuser`**
   - Checks `getByLabel("Администратор?")` and `getByLabel("Активен?")`
   - Clicks `"Сохранить"`
   - Asserts `userRow.getByText("Администратор")` (`columns.tsx` line 46)
   - **Verdict:** Passes.

5. **`Edit a user successfully`**
   - Opens action menu via `userRow.getByRole("button").click()`
   - Clicks `page.getByRole("menuitem", { name: "Редактировать" })`
   - Fills updated name in `getByPlaceholder("ФИО")`
   - Clicks `page.getByRole("button", { name: "Сохранить" })` ⚠️
   - **Verdict:** **FAILS currently** because `EditUser.tsx` button label is `"Save"`. **PASSES once translated to `"Сохранить"`.**

6. **`Delete a user successfully`**
   - Opens action menu
   - Clicks `page.getByRole("menuitem", { name: "Удалить" })`
   - Clicks modal button `page.getByRole("button", { name: "Удалить" })` ⚠️
   - **Verdict:** **FAILS currently** because `DeleteUser.tsx` button label is `"Delete"`. **PASSES once translated to `"Удалить"`.**

7. **`Cancel user creation`**
   - Opens add user dialog, fills email
   - Clicks `page.getByRole("button", { name: "Отменить" })`
   - Expects dialog not visible
   - **Verdict:** Passes.

8. **`Email is required and must be valid`**
   - Inputs invalid email, triggers blur
   - Expects `getByText("Неверный адрес email")`
   - **Verdict:** Passes.

9. **`Password must be at least 8 characters`**
   - Enters short password
   - Clicks `"Сохранить"`
   - Expects `getByText("Пароль должен содержать не менее 8 символов")`
   - **Verdict:** Passes.

10. **`Passwords must match`**
    - Enters mismatching passwords
    - Expects `getByText("Пароли не совпадают")`
    - **Verdict:** Passes.

11. **`Non-superuser cannot access admin page`**
    - Creates regular user, logs in, visits `/admin`
    - Verifies heading `"Пользователи"` not visible and URL is not `/admin` (redirected to `/`)
    - **Verdict:** Passes.

12. **`Superuser can access admin page`**
    - Logs in as initial superuser
    - Verifies heading `"Пользователи"` is visible
    - **Verdict:** Passes.

---

## 5. Design System, Role Badges & Styling Guidelines

### 5.1 Emerald / Jade Color System Tokens
Per the design tokens and approved design system:
- **Primary / Superuser Badge:** Emerald accent (`oklch(0.54 0.15 156)` light / `oklch(0.66 0.15 156)` dark). The badge `<Badge variant="default">Администратор</Badge>` renders with primary styling.
- **Regular User Badge:** `<Badge variant="secondary">Пользователь</Badge>` renders with subtle slate/zinc styling.
- **Current User Badge:** `<Badge variant="outline" className="text-xs">Вы</Badge>` provides clean demarcation without visual clutter.
- **Status Dot & Indicator:**
  - Active: `<span className="size-2 rounded-full bg-emerald-500" />` + text `"Активен"`.
  - Inactive: `<span className="size-2 rounded-full bg-muted-foreground/50" />` + text `"Неактивен"`.

### 5.2 Accessibility & Form Usability
- Form labels utilize semantic `<FormLabel>` connected to inputs via Radix UI `FormItem` context.
- Required indicators use `<span className="text-destructive">*</span>`.
- Icon buttons provide appropriate `aria-label` or `<span className="sr-only">`.
- Focus outlines conform to WCAG AA with `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.

---

## 6. Exact Proposed Code Changes (Diff Preview)

### 6.1 `frontend/src/components/Admin/EditUser.tsx`
```diff
@@ -222,12 +222,12 @@
             <DialogFooter>
               <DialogClose asChild>
                 <Button variant="outline" disabled={mutation.isPending}>
-                  Cancel
+                  Отменить
                 </Button>
               </DialogClose>
               <LoadingButton type="submit" loading={mutation.isPending}>
-                Save
+                Сохранить
               </LoadingButton>
             </DialogFooter>
           </form>
```

### 6.2 `frontend/src/components/Admin/DeleteUser.tsx`
```diff
@@ -75,14 +75,14 @@
           <DialogFooter className="mt-4">
             <DialogClose asChild>
               <Button variant="outline" disabled={mutation.isPending}>
-                Cancel
+                Отменить
               </Button>
             </DialogClose>
             <LoadingButton
               variant="destructive"
               type="submit"
               loading={mutation.isPending}
             >
-              Delete
+              Удалить
             </LoadingButton>
           </DialogFooter>
```

### 6.3 `frontend/src/components/Admin/columns.tsx`
```diff
@@ -24,7 +24,7 @@
           </span>
           {row.original.isCurrentUser && (
             <Badge variant="outline" className="text-xs">
-              You
+              Вы
             </Badge>
           )}
         </div>
@@ -66,7 +66,7 @@
   },
   {
     id: "actions",
-    header: () => <span className="sr-only">Actions</span>,
+    header: () => <span className="sr-only">Действия</span>,
     cell: ({ row }) => (
       <div className="flex justify-end">
         <UserActionsMenu user={row.original} />
```

### 6.4 `frontend/src/components/Pending/PendingUsers.tsx`
```diff
@@ -12,11 +12,11 @@
   <Table>
     <TableHeader>
       <TableRow>
-        <TableHead>Full Name</TableHead>
+        <TableHead>ФИО</TableHead>
         <TableHead>Email</TableHead>
-        <TableHead>Role</TableHead>
-        <TableHead>Status</TableHead>
+        <TableHead>Роль</TableHead>
+        <TableHead>Статус</TableHead>
         <TableHead>
-          <span className="sr-only">Actions</span>
+          <span className="sr-only">Действия</span>
         </TableHead>
       </TableRow>
```

### 6.5 `frontend/src/components/UserSettings/DeleteConfirmation.tsx`
```diff
@@ -44,7 +44,7 @@
     <Dialog>
       <DialogTrigger asChild>
         <Button variant="destructive" className="mt-3">
-          Delete Account
+          Удалить аккаунт
         </Button>
       </DialogTrigger>
       <DialogContent>
@@ -62,13 +62,13 @@
           <DialogFooter className="mt-4">
             <DialogClose asChild>
               <Button variant="outline" disabled={mutation.isPending}>
-                Cancel
+                Отменить
               </Button>
             </DialogClose>
             <LoadingButton
               variant="destructive"
               type="submit"
               loading={mutation.isPending}
             >
-              Delete
+              Удалить
             </LoadingButton>
           </DialogFooter>
```

---

## 7. Next Steps & Recommendations for Implementer

1. **Apply Admin Fixes:** Update `EditUser.tsx`, `DeleteUser.tsx`, `columns.tsx`, `PendingUsers.tsx` as identified above.
2. **Apply Settings & Common Fixes:** Update `DeleteConfirmation.tsx`, `DataTable.tsx`, `Appearance.tsx`, `ErrorComponent.tsx`, `NotFound.tsx`.
3. **Execute Verification:**
   - Run `npm run build` in `frontend/` to confirm zero TypeScript compilation errors.
   - Run `npx playwright test tests/admin.spec.ts` to verify 12/12 admin tests pass cleanly.
