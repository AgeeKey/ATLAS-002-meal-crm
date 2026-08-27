import { expect, test } from "@playwright/test"
import { firstSuperuser, firstSuperuserPassword } from "./config.ts"
import { createUser } from "./utils/privateApi"
import { randomEmail, randomPassword } from "./utils/random"
import { logInUser } from "./utils/user"

test("Admin page is accessible and shows correct title", async ({ page }) => {
  await page.goto("/admin")
  await expect(
    page.getByRole("heading", { name: "Пользователи" }),
  ).toBeVisible()
  await expect(
    page.getByText("Управление пользователями и правами доступа"),
  ).toBeVisible()
})

test("Add User button is visible", async ({ page }) => {
  await page.goto("/admin")
  await expect(
    page.getByRole("button", { name: "Добавить пользователя" }),
  ).toBeVisible()
})

test.describe("Admin user management", () => {
  test("Create a new user successfully", async ({ page }) => {
    await page.goto("/admin")

    const email = randomEmail()
    const password = randomPassword()
    const fullName = "Test User Admin"

    await page.getByRole("button", { name: "Добавить пользователя" }).click()

    await page.getByPlaceholder("Email").fill(email)
    await page.getByPlaceholder("ФИО").fill(fullName)
    await page.getByPlaceholder("Пароль").first().fill(password)
    await page.getByPlaceholder("Пароль").last().fill(password)

    await page.getByRole("button", { name: "Сохранить" }).click()

    await expect(page.getByText("Пользователь успешно создан")).toBeVisible()

    await expect(page.getByRole("dialog")).not.toBeVisible()

    const userRow = page.getByRole("row").filter({ hasText: email })
    await expect(userRow).toBeVisible()
  })

  test("Create a superuser", async ({ page }) => {
    await page.goto("/admin")

    const email = randomEmail()
    const password = randomPassword()

    await page.getByRole("button", { name: "Добавить пользователя" }).click()

    await page.getByPlaceholder("Email").fill(email)
    await page.getByPlaceholder("Пароль").first().fill(password)
    await page.getByPlaceholder("Пароль").last().fill(password)
    await page.getByLabel("Администратор?").check()
    await page.getByLabel("Активен?").check()

    await page.getByRole("button", { name: "Сохранить" }).click()

    await expect(page.getByText("Пользователь успешно создан")).toBeVisible()

    await expect(page.getByRole("dialog")).not.toBeVisible()

    const userRow = page.getByRole("row").filter({ hasText: email })
    // "Superuser" tag in columns.tsx might be translated
    await expect(userRow.getByText("Администратор")).toBeVisible()
  })

  test("Edit a user successfully", async ({ page }) => {
    await page.goto("/admin")

    const email = randomEmail()
    const password = randomPassword()
    const originalName = "Original Name"
    const updatedName = "Updated Name"

    await page.getByRole("button", { name: "Добавить пользователя" }).click()
    await page.getByPlaceholder("Email").fill(email)
    await page.getByPlaceholder("ФИО").fill(originalName)
    await page.getByPlaceholder("Пароль").first().fill(password)
    await page.getByPlaceholder("Пароль").last().fill(password)
    await page.getByRole("button", { name: "Сохранить" }).click()

    await expect(page.getByText("Пользователь успешно создан")).toBeVisible()
    await expect(page.getByRole("dialog")).not.toBeVisible()

    const userRow = page.getByRole("row").filter({ hasText: email })
    await userRow.getByRole("button").click()

    await page.getByRole("menuitem", { name: "Редактировать" }).click()

    await page.getByPlaceholder("ФИО").fill(updatedName)
    await page.getByRole("button", { name: "Сохранить" }).click()

    await expect(page.getByText("Пользователь успешно обновлен")).toBeVisible()
    await expect(page.getByText(updatedName)).toBeVisible()
  })

  test("Delete a user successfully", async ({ page }) => {
    await page.goto("/admin")

    const email = randomEmail()
    const password = randomPassword()

    await page.getByRole("button", { name: "Добавить пользователя" }).click()
    await page.getByPlaceholder("Email").fill(email)
    await page.getByPlaceholder("Пароль").first().fill(password)
    await page.getByPlaceholder("Пароль").last().fill(password)
    await page.getByRole("button", { name: "Сохранить" }).click()

    await expect(page.getByText("Пользователь успешно создан")).toBeVisible()

    await expect(page.getByRole("dialog")).not.toBeVisible()

    const userRow = page.getByRole("row").filter({ hasText: email })
    await userRow.getByRole("button").click()

    await page.getByRole("menuitem", { name: "Удалить" }).click()

    await page.getByRole("button", { name: "Удалить" }).click()

    await expect(page.getByText("Пользователь успешно удален")).toBeVisible()

    await expect(
      page.getByRole("row").filter({ hasText: email }),
    ).not.toBeVisible()
  })

  test("Cancel user creation", async ({ page }) => {
    await page.goto("/admin")

    await page.getByRole("button", { name: "Добавить пользователя" }).click()
    await page.getByPlaceholder("Email").fill("test@example.com")

    await page.getByRole("button", { name: "Отменить" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("Email is required and must be valid", async ({ page }) => {
    await page.goto("/admin")

    await page.getByRole("button", { name: "Добавить пользователя" }).click()

    await page.getByPlaceholder("Email").fill("invalid-email")
    await page.getByPlaceholder("Email").blur()

    await expect(page.getByText("Неверный адрес email")).toBeVisible()
  })

  test("Password must be at least 8 characters", async ({ page }) => {
    await page.goto("/admin")

    await page.getByRole("button", { name: "Добавить пользователя" }).click()

    await page.getByPlaceholder("Email").fill(randomEmail())
    await page.getByPlaceholder("Пароль").first().fill("short")
    await page.getByPlaceholder("Пароль").last().fill("short")
    await page.getByRole("button", { name: "Сохранить" }).click()

    await expect(
      page.getByText("Пароль должен содержать не менее 8 символов"),
    ).toBeVisible()
  })

  test("Passwords must match", async ({ page }) => {
    await page.goto("/admin")

    await page.getByRole("button", { name: "Добавить пользователя" }).click()

    await page.getByPlaceholder("Email").fill(randomEmail())
    await page.getByPlaceholder("Пароль").first().fill(randomPassword())
    await page.getByPlaceholder("Пароль").last().fill("different12345")
    await page.getByPlaceholder("Пароль").last().blur()

    await expect(page.getByText("Пароли не совпадают")).toBeVisible()
  })
})

test.describe("Admin page access control", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Non-superuser cannot access admin page", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()

    await createUser({ email, password })
    await logInUser(page, email, password)

    await page.goto("/admin")

    await expect(
      page.getByRole("heading", { name: "Пользователи" }),
    ).not.toBeVisible()
    await expect(page).not.toHaveURL(/\/admin/)
  })

  test("Superuser can access admin page", async ({ page }) => {
    await logInUser(page, firstSuperuser, firstSuperuserPassword)

    await page.goto("/admin")

    await expect(
      page.getByRole("heading", { name: "Пользователи" }),
    ).toBeVisible()
  })
})
