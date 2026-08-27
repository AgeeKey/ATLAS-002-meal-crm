import { expect, test } from "@playwright/test"

const randomPhone = () =>
  `555${Math.random().toString().slice(2, 11)}`.slice(0, 12)

const randomClientName = () =>
  `Client ${Math.random().toString(36).substring(2, 8)}`

const TODAY = new Date().toISOString().slice(0, 10)
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
const TOMORROW = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

const formatDisplayedDate = (value: string) =>
  new Date(value).toLocaleDateString("ru-KG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

// ─── helpers ─────────────────────────────────────────────────────────────────

async function createClient(
  page: import("@playwright/test").Page,
  name: string,
  phone: string,
) {
  await page.goto("/clients")
  await page.getByRole("button", { name: "Добавить клиента" }).click()
  await page.getByLabel("Имя *").fill(name)
  await page.getByLabel("Телефон *").fill(phone)
  await page.getByRole("button", { name: "Сохранить" }).click()
  await expect(page.getByText("Клиент успешно добавлен")).toBeVisible()
}

async function openClientDetail(
  page: import("@playwright/test").Page,
  clientName: string,
) {
  await page.goto("/clients")
  await page.getByRole("link", { name: clientName }).click()
  await expect(page.getByRole("heading", { name: clientName })).toBeVisible()
}

// ─── basic navigation ─────────────────────────────────────────────────────────

test("Client list page loads and shows heading", async ({ page }) => {
  await page.goto("/clients")

  await expect(page.getByRole("heading", { name: "Клиенты" })).toBeVisible()
  await expect(
    page.getByText(
      "Управление клиентской базой, статусами пакетов и заметками.",
    ),
  ).toBeVisible()
})

test("Can navigate to create client form", async ({ page }) => {
  await page.goto("/clients")

  await page.getByRole("button", { name: "Добавить клиента" }).click()

  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Добавление клиента" }),
  ).toBeVisible()
  await expect(page.getByLabel("Имя *")).toBeVisible()
  await expect(page.getByLabel("Телефон *")).toBeVisible()
})

test("Can navigate to client detail page", async ({ page }) => {
  const clientName = randomClientName()
  const phone = randomPhone()

  await page.goto("/clients")
  await page.getByRole("button", { name: "Добавить клиента" }).click()
  await page.getByLabel("Имя *").fill(clientName)
  await page.getByLabel("Телефон *").fill(phone)
  await page.getByRole("button", { name: "Сохранить" }).click()

  await expect(page.getByText("Клиент успешно добавлен")).toBeVisible()
  await page.getByRole("link", { name: clientName }).click()

  await expect(page.getByRole("heading", { name: clientName })).toBeVisible()
  await expect(page.getByText(phone)).toBeVisible()
})

// ─── dashboard ────────────────────────────────────────────────────────────────

test("Dashboard shows stats section", async ({ page }) => {
  await page.goto("/")

  await expect(
    page.getByText("Добро пожаловать в панель управления CRM!"),
  ).toBeVisible()
  await expect(page.getByRole("heading", { name: "Сводка CRM" })).toBeVisible()
  await expect(page.getByText("Активные клиенты")).toBeVisible()
})

test("Dashboard shows Today's deliveries card with a numeric value", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.getByText("Доставки на сегодня")).toBeVisible()
  const valueText = await page
    .getByTestId("todays-deliveries-value")
    .textContent()
  expect(Number(valueText)).toBeGreaterThanOrEqual(0)
})

// ─── package creation (3X and 5X) ─────────────────────────────────────────────

test("Can add a 3X package to a client", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("button", { name: "Добавить пакет" }).click()
  // Select 3X meal type
  await page.getByRole("combobox").first().click()
  await page.getByRole("option", { name: "3X" }).click()
  await page.getByLabel("Кол-во дней").fill("10")
  await page.getByLabel("Цена").fill("5000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()

  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()
  await expect(page.getByText("3X пакет")).toBeVisible()
})

test("Can add a 5X package to a client", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByRole("combobox").first().click()
  await page.getByRole("option", { name: "5X" }).click()
  await page.getByLabel("Кол-во дней").fill("20")
  await page.getByLabel("Цена").fill("9000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()

  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()
  await expect(page.getByText("5X пакет")).toBeVisible()
})

// ─── delivery history (persistent after reload) ───────────────────────────────

test("Delivery is persisted after page reload", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  // Create a package first
  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByLabel("Кол-во дней").fill("10")
  await page.getByLabel("Цена").fill("5000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()

  // Expand the package card
  await page.getByRole("button", { name: "Подробнее" }).first().click()

  // Add a delivery
  await page.getByRole("button", { name: "Добавить доставку" }).click()
  await page.getByLabel("Дата питания").fill(TODAY)
  await page.getByLabel("Дата передачи / сборки").fill(YESTERDAY)
  await page.getByRole("button", { name: "Сохранить доставку" }).click()
  await expect(page.getByText("Доставка успешно добавлена")).toBeVisible()

  // Verify delivery appears in the UI
  const localDate = formatDisplayedDate(TODAY)
  await expect(page.getByText(`Дата питания: ${localDate}`)).toBeVisible()

  // Reload the page and verify delivery is still shown
  await page.reload()
  await page.getByRole("button", { name: "Подробнее" }).first().click()
  await expect(page.getByText(`Дата питания: ${localDate}`)).toBeVisible()
})

// ─── freeze history (persistent after reload) ─────────────────────────────────

test("Freeze is persisted after page reload", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByLabel("Кол-во дней").fill("10")
  await page.getByLabel("Цена").fill("5000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()

  await page.getByRole("button", { name: "Подробнее" }).first().click()

  await page.getByRole("button", { name: "Добавить заморозку" }).click()
  await page.getByLabel("Дата начала").fill(YESTERDAY)
  await page.getByLabel("Дата окончания").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить заморозку" }).click()
  await expect(page.getByText("Заморозка успешно добавлена")).toBeVisible()

  // Verify freeze days appear in the summary
  await expect(page.getByText("Заморожено дней: 2")).toBeVisible()

  // Reload and verify persistence
  await page.reload()
  await page.getByRole("button", { name: "Подробнее" }).first().click()
  await expect(page.getByText("Заморожено дней: 2")).toBeVisible()
})

// ─── extension history (persistent after reload) ──────────────────────────────

test("Extension is persisted after page reload", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByLabel("Кол-во дней").fill("10")
  await page.getByLabel("Цена").fill("5000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()

  await page.getByRole("button", { name: "Подробнее" }).first().click()

  await page.getByRole("button", { name: "Добавить продление" }).click()
  await page.getByLabel("Доп. дни").fill("5")
  await page.getByLabel("Доплата").fill("1900")
  await page.getByLabel("Дата").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить продление" }).click()
  await expect(page.getByText("Продление успешно добавлено")).toBeVisible()

  // Verify the extension history shows the added days and price
  await expect(page.getByText("+5 дней (на")).toBeVisible()
  await expect(page.getByText("Доплата: 1 900")).toBeVisible()

  // Reload and verify persistence
  await page.reload()
  await page.getByRole("button", { name: "Подробнее" }).first().click()
  await expect(page.getByText("+5 дней (на")).toBeVisible()
  await expect(page.getByText("Доплата: 1 900")).toBeVisible()
})

// ─── partial payments / debt ──────────────────────────────────────────────────

test("Partial payment creates debt and shows debt badge", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  // Create package with price 10000, pay only 3000 → debt 7000
  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByLabel("Кол-во дней").fill("10")
  await page.getByLabel("Цена").fill("10000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()

  await page.getByRole("button", { name: "Подробнее" }).first().click()

  await page.getByRole("button", { name: "Добавить оплату" }).click()
  await page.getByLabel("Сумма").fill("3000")
  await page.getByLabel("Дата").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить оплату" }).click()
  await expect(page.getByText("Оплата успешно добавлена")).toBeVisible()

  // Debt badge should show 7,000
  await expect(page.getByText(/Долг.*7.?000/).first()).toBeVisible()
})

// ─── multiple packages ────────────────────────────────────────────────────────

test("Client can have multiple packages", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  // First package
  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByRole("combobox").first().click()
  await page.getByRole("option", { name: "3X" }).click()
  await page.getByLabel("Кол-во дней").fill("10")
  await page.getByLabel("Цена").fill("5000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()

  // Second package
  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByRole("combobox").first().click()
  await page.getByRole("option", { name: "5X" }).click()
  await page.getByLabel("Кол-во дней").fill("20")
  await page.getByLabel("Цена").fill("9000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()

  // Both package types should be visible
  await expect(page.getByText("3X пакет")).toBeVisible()
  await expect(page.getByText("5X пакет")).toBeVisible()
  // Packages count in the summary tile
  await expect(page.getByText("2").first()).toBeVisible()
})

// ─── package status change ────────────────────────────────────────────────────

test("Package status can be changed", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByLabel("Кол-во дней").fill("10")
  await page.getByLabel("Цена").fill("5000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()

  // Change status to paused
  await page.getByRole("button", { name: "Обновить статус" }).first().click()
  await page.getByRole("combobox").last().click()
  await page.getByRole("option", { name: "На паузе" }).click()
  await page.getByRole("button", { name: "Сохранить статус" }).click()
  await expect(page.getByText("Статус пакета успешно обновлен")).toBeVisible()

  await expect(page.getByText("На паузе").first()).toBeVisible()
})

// ─── extension added price / total obligation ──────────────────────────────

test("Extension with added price shows total obligation and debt correctly", async ({
  page,
}) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  // Create a 10-day package with price 11,000
  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByLabel("Кол-во дней").fill("10")
  await page.getByLabel("Цена").fill("11000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()

  await page.getByRole("button", { name: "Подробнее" }).first().click()

  // Add extension with added_price = 19,000
  await page.getByRole("button", { name: "Добавить продление" }).click()
  await page.getByLabel("Доп. дни").fill("20")
  await page.getByLabel("Доплата").fill("19000")
  await page.getByLabel("Дата").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить продление" }).click()
  await expect(page.getByText("Продление успешно добавлено")).toBeVisible()

  // Total obligation should be 30,000
  await expect(page.getByText(/Общая стоимость/)).toBeVisible()
  await expect(page.getByText(/30.?000/).first()).toBeVisible()

  // Reload and verify obligation persists
  await page.reload()
  await page.getByRole("button", { name: "Подробнее" }).first().click()
  await expect(page.getByText(/30.?000/).first()).toBeVisible()
})

// ─── delivery send/meal date semantics ────────────────────────────────────

test("Delivery form auto-sets send date to one day before meal date", async ({
  page,
}) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByLabel("Кол-во дней").fill("5")
  await page.getByLabel("Цена").fill("5000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()

  await page.getByRole("button", { name: "Подробнее" }).first().click()

  await page.getByRole("button", { name: "Добавить доставку" }).click()
  // Check labels exist
  await expect(page.getByLabel("Дата питания")).toBeVisible()
  await expect(page.getByLabel("Дата передачи / сборки")).toBeVisible()

  // When meal date is set, send date should be automatically populated as day before
  await page.getByLabel("Дата питания").fill(TODAY)
  const sendDateValue = await page
    .getByLabel("Дата передачи / сборки")
    .inputValue()
  expect(sendDateValue).toBe(YESTERDAY)
})

// ─── completed package blocks further delivery ─────────────────────────────

test("Completed package cannot have new deliveries added", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  // Create a 1-day package
  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByLabel("Кол-во дней").fill("1")
  await page.getByLabel("Цена").fill("1000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()

  await page.getByRole("button", { name: "Подробнее" }).first().click()

  // Add the single allowed delivery
  await page.getByRole("button", { name: "Добавить доставку" }).click()
  await page.getByLabel("Дата питания").fill(TODAY)
  await page.getByLabel("Дата передачи / сборки").fill(YESTERDAY)
  await page.getByRole("button", { name: "Сохранить доставку" }).click()
  await expect(page.getByText("Доставка успешно добавлена")).toBeVisible()

  // Package should now show completed status
  await page.reload()
  await expect(page.getByText("Завершен")).toBeVisible()

  // Trying to add another delivery should fail with an error
  await page.getByRole("button", { name: "Подробнее" }).first().click()
  await page.getByRole("button", { name: "Добавить доставку" }).click()
  // Use a different date for the next meal
  const dayAfterTomorrow = new Date(Date.now() + 2 * 86400000)
    .toISOString()
    .slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  await page.getByLabel("Дата питания").fill(dayAfterTomorrow)
  await page.getByLabel("Дата передачи / сборки").fill(tomorrow)
  await page.getByRole("button", { name: "Сохранить доставку" }).click()
  // API rejects the request; dialog should remain open (no success toast)
  await expect(page.getByText("Доставка успешно добавлена")).not.toBeVisible({
    timeout: 3000,
  })
})

// ─── full history persists after reload (multiple packages) ───────────────

test("Multiple packages history survives page reload", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  // Package 1: 3X
  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByRole("combobox").first().click()
  await page.getByRole("option", { name: "3X" }).click()
  await page.getByLabel("Кол-во дней").fill("5")
  await page.getByLabel("Цена").fill("5000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()

  // Package 2: 5X
  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByRole("dialog").getByRole("combobox").click()
  await page.getByRole("option", { name: "5X" }).click()
  await page.getByLabel("Кол-во дней").fill("10")
  await page.getByLabel("Цена").fill("9000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен").first()).toBeVisible()

  // Reload and verify both packages are still shown
  await page.reload()
  await expect(page.getByText("3X пакет")).toBeVisible()
  await expect(page.getByText("5X пакет")).toBeVisible()
})

// ─── partial payments: zero debt on full payment ─────────────────────────

test("Three partial payments equal to full price result in zero debt", async ({
  page,
}) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByLabel("Кол-во дней").fill("10")
  await page.getByLabel("Цена").fill("9000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()

  await page.getByRole("button", { name: "Подробнее" }).first().click()

  for (const amount of ["3000", "3000", "3000"]) {
    await page.getByRole("button", { name: "Добавить оплату" }).click()
    await page.getByLabel("Сумма").fill(amount)
    await page.getByLabel("Дата").fill(TODAY)
    await page.getByRole("button", { name: "Сохранить оплату" }).click()
    await expect(
      page.getByText("Оплата успешно добавлена").first(),
    ).toBeVisible()
  }

  // Debt should be 0
  await expect(page.getByText(/Долг.*0/).first()).toBeVisible()
})

test("Client notes persist after page reload", async ({ page }) => {
  const clientName = randomClientName()
  const noteText = `Note ${Math.random().toString(36).slice(2, 8)}`

  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("tab", { name: "Заметки" }).click()
  await page.getByLabel("Новая заметка").fill(noteText)
  await page.getByRole("button", { name: "Сохранить заметку" }).click()
  await expect(page.getByText("Заметка успешно добавлена")).toBeVisible()
  await expect(page.getByText(noteText)).toBeVisible()

  await page.reload()
  await page.getByRole("tab", { name: "Заметки" }).click()
  await expect(page.getByText(noteText)).toBeVisible()
})

test("Dashboard today's deliveries count increases after adding today's delivery", async ({
  page,
}) => {
  const clientName = randomClientName()
  await page.goto("/")

  const initialCount = Number(
    await page.getByTestId("todays-deliveries-value").textContent(),
  )

  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("button", { name: "Добавить пакет" }).click()
  await page.getByLabel("Кол-во дней").fill("10")
  await page.getByLabel("Цена").fill("5000")
  await page.getByLabel("Дата начала").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить пакет" }).click()
  await expect(page.getByText("Пакет успешно добавлен")).toBeVisible()

  await page.getByRole("button", { name: "Подробнее" }).first().click()
  await page.getByRole("button", { name: "Добавить доставку" }).click()
  // Send / package day = TODAY, meal date = TOMORROW → counts toward today's deliveries
  await page.getByLabel("Дата питания").fill(TOMORROW)
  await page.getByLabel("Дата передачи / сборки").fill(TODAY)
  await page.getByRole("button", { name: "Сохранить доставку" }).click()
  await expect(page.getByText("Доставка успешно добавлена")).toBeVisible()

  await page.goto("/")
  await expect(page.getByText("Доставки на сегодня")).toBeVisible()
  const updatedCount = Number(
    await page.getByTestId("todays-deliveries-value").textContent(),
  )
  expect(updatedCount).toBe(initialCount + 1)
})
