import { expect, test } from "@playwright/test"

const randomPhone = () =>
  `555${Math.random().toString().slice(2, 11)}`.slice(0, 12)

const randomClientName = () =>
  `Client ${Math.random().toString(36).substring(2, 8)}`

const TODAY = new Date().toISOString().slice(0, 10)
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

// ─── helpers ─────────────────────────────────────────────────────────────────

async function createClient(
  page: import("@playwright/test").Page,
  name: string,
  phone: string,
) {
  await page.goto("/clients")
  await page.getByRole("button", { name: "Add Client" }).click()
  await page.getByLabel("Name *").fill(name)
  await page.getByLabel("Phone *").fill(phone)
  await page.getByRole("button", { name: "Save" }).click()
  await expect(page.getByText("Client created successfully")).toBeVisible()
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

  await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible()
  await expect(
    page.getByText(
      "Track customers, package activity, and notes in one place.",
    ),
  ).toBeVisible()
})

test("Can navigate to create client form", async ({ page }) => {
  await page.goto("/clients")

  await page.getByRole("button", { name: "Add Client" }).click()

  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Add Client" })).toBeVisible()
  await expect(page.getByLabel("Name *")).toBeVisible()
  await expect(page.getByLabel("Phone *")).toBeVisible()
})

test("Can navigate to client detail page", async ({ page }) => {
  const clientName = randomClientName()
  const phone = randomPhone()

  await page.goto("/clients")
  await page.getByRole("button", { name: "Add Client" }).click()
  await page.getByLabel("Name *").fill(clientName)
  await page.getByLabel("Phone *").fill(phone)
  await page.getByRole("button", { name: "Save" }).click()

  await expect(page.getByText("Client created successfully")).toBeVisible()
  await page.getByRole("link", { name: clientName }).click()

  await expect(page.getByRole("heading", { name: clientName })).toBeVisible()
  await expect(page.getByText(phone)).toBeVisible()
})

// ─── dashboard ────────────────────────────────────────────────────────────────

test("Dashboard shows stats section", async ({ page }) => {
  await page.goto("/")

  await expect(
    page.getByText("Welcome back, nice to see you again!"),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "CRM Overview" }),
  ).toBeVisible()
  await expect(page.getByText("Active clients")).toBeVisible()
})

test("Dashboard shows Today's deliveries card with a numeric value", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.getByText("Today's deliveries")).toBeVisible()
  // The card value should be a non-negative integer (real count, not placeholder)
  const card = page.locator("text=Today's deliveries").locator("..")
  const valueText = await card
    .locator(".text-3xl")
    .first()
    .textContent()
  expect(Number(valueText)).toBeGreaterThanOrEqual(0)
})

// ─── package creation (3X and 5X) ─────────────────────────────────────────────

test("Can add a 3X package to a client", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("button", { name: "Add Package" }).click()
  // Select 3X meal type
  await page.getByRole("combobox").first().click()
  await page.getByRole("option", { name: "3X" }).click()
  await page.getByLabel("Total days").fill("10")
  await page.getByLabel("Price").fill("5000")
  await page.getByLabel("Start date").fill(TODAY)
  await page.getByRole("button", { name: "Save Package" }).click()

  await expect(page.getByText("Package created successfully")).toBeVisible()
  await expect(page.getByText("3X package")).toBeVisible()
})

test("Can add a 5X package to a client", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("button", { name: "Add Package" }).click()
  await page.getByRole("combobox").first().click()
  await page.getByRole("option", { name: "5X" }).click()
  await page.getByLabel("Total days").fill("20")
  await page.getByLabel("Price").fill("9000")
  await page.getByLabel("Start date").fill(TODAY)
  await page.getByRole("button", { name: "Save Package" }).click()

  await expect(page.getByText("Package created successfully")).toBeVisible()
  await expect(page.getByText("5X package")).toBeVisible()
})

// ─── delivery history (persistent after reload) ───────────────────────────────

test("Delivery is persisted after page reload", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  // Create a package first
  await page.getByRole("button", { name: "Add Package" }).click()
  await page.getByLabel("Total days").fill("10")
  await page.getByLabel("Price").fill("5000")
  await page.getByLabel("Start date").fill(TODAY)
  await page.getByRole("button", { name: "Save Package" }).click()
  await expect(page.getByText("Package created successfully")).toBeVisible()

  // Expand the package card
  await page.getByRole("button", { name: "Show Details" }).first().click()

  // Add a delivery
  await page.getByRole("button", { name: "Add Delivery" }).click()
  await page.getByLabel("Meal date").fill(TODAY)
  await page.getByLabel("Send date").fill(YESTERDAY)
  await page.getByRole("button", { name: "Save Delivery" }).click()
  await expect(page.getByText("Delivery created successfully")).toBeVisible()

  // Verify delivery appears in the UI
  const [year, month, day] = TODAY.split("-").map(Number)
  const localDate = new Date(year, month - 1, day).toLocaleDateString()
  await expect(
    page.getByText(`Meal date: ${localDate}`),
  ).toBeVisible()

  // Reload the page and verify delivery is still shown
  await page.reload()
  await page.getByRole("button", { name: "Show Details" }).first().click()
  await expect(
    page.getByText(`Meal date: ${localDate}`),
  ).toBeVisible()
})

// ─── freeze history (persistent after reload) ─────────────────────────────────

test("Freeze is persisted after page reload", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("button", { name: "Add Package" }).click()
  await page.getByLabel("Total days").fill("10")
  await page.getByLabel("Price").fill("5000")
  await page.getByLabel("Start date").fill(TODAY)
  await page.getByRole("button", { name: "Save Package" }).click()
  await expect(page.getByText("Package created successfully")).toBeVisible()

  await page.getByRole("button", { name: "Show Details" }).first().click()

  await page.getByRole("button", { name: "Add Freeze" }).click()
  await page.getByLabel("Start date").fill(YESTERDAY)
  await page.getByLabel("End date").fill(TODAY)
  await page.getByRole("button", { name: "Save Freeze" }).click()
  await expect(page.getByText("Freeze created successfully")).toBeVisible()

  // Verify freeze days appear in the summary
  await expect(page.getByText("Frozen days:")).toBeVisible()

  // Reload and verify persistence
  await page.reload()
  await page.getByRole("button", { name: "Show Details" }).first().click()
  await expect(page.getByText("Frozen days:")).toBeVisible()
})

// ─── extension history (persistent after reload) ──────────────────────────────

test("Extension is persisted after page reload", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("button", { name: "Add Package" }).click()
  await page.getByLabel("Total days").fill("10")
  await page.getByLabel("Price").fill("5000")
  await page.getByLabel("Start date").fill(TODAY)
  await page.getByRole("button", { name: "Save Package" }).click()
  await expect(page.getByText("Package created successfully")).toBeVisible()

  await page.getByRole("button", { name: "Show Details" }).first().click()

  await page.getByRole("button", { name: "Add Extension" }).click()
  await page.getByLabel("Extra days").fill("5")
  await page.getByLabel("Date").fill(TODAY)
  await page.getByRole("button", { name: "Save Extension" }).click()
  await expect(page.getByText("Extension created successfully")).toBeVisible()

  // Verify "+5 days" appears
  await expect(page.getByText("+5 days on")).toBeVisible()

  // Reload and verify persistence
  await page.reload()
  await page.getByRole("button", { name: "Show Details" }).first().click()
  await expect(page.getByText("+5 days on")).toBeVisible()
})

// ─── partial payments / debt ──────────────────────────────────────────────────

test("Partial payment creates debt and shows debt badge", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  // Create package with price 10000, pay only 3000 → debt 7000
  await page.getByRole("button", { name: "Add Package" }).click()
  await page.getByLabel("Total days").fill("10")
  await page.getByLabel("Price").fill("10000")
  await page.getByLabel("Start date").fill(TODAY)
  await page.getByRole("button", { name: "Save Package" }).click()
  await expect(page.getByText("Package created successfully")).toBeVisible()

  await page.getByRole("button", { name: "Show Details" }).first().click()

  await page.getByRole("button", { name: "Add Payment" }).click()
  await page.getByLabel("Amount").fill("3000")
  await page.getByLabel("Date").fill(TODAY)
  await page.getByRole("button", { name: "Save Payment" }).click()
  await expect(page.getByText("Payment created successfully")).toBeVisible()

  // Debt badge should show 7,000
  await expect(page.getByText(/Debt.*7.?000/)).toBeVisible()
})

// ─── multiple packages ────────────────────────────────────────────────────────

test("Client can have multiple packages", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  // First package
  await page.getByRole("button", { name: "Add Package" }).click()
  await page.getByRole("combobox").first().click()
  await page.getByRole("option", { name: "3X" }).click()
  await page.getByLabel("Total days").fill("10")
  await page.getByLabel("Price").fill("5000")
  await page.getByLabel("Start date").fill(TODAY)
  await page.getByRole("button", { name: "Save Package" }).click()
  await expect(page.getByText("Package created successfully")).toBeVisible()

  // Second package
  await page.getByRole("button", { name: "Add Package" }).click()
  await page.getByRole("combobox").first().click()
  await page.getByRole("option", { name: "5X" }).click()
  await page.getByLabel("Total days").fill("20")
  await page.getByLabel("Price").fill("9000")
  await page.getByLabel("Start date").fill(TODAY)
  await page.getByRole("button", { name: "Save Package" }).click()
  await expect(page.getByText("Package created successfully")).toBeVisible()

  // Both package types should be visible
  await expect(page.getByText("3X package")).toBeVisible()
  await expect(page.getByText("5X package")).toBeVisible()
  // Packages count in the summary tile
  await expect(page.getByText("2").first()).toBeVisible()
})

// ─── package status change ────────────────────────────────────────────────────

test("Package status can be changed", async ({ page }) => {
  const clientName = randomClientName()
  await createClient(page, clientName, randomPhone())
  await openClientDetail(page, clientName)

  await page.getByRole("button", { name: "Add Package" }).click()
  await page.getByLabel("Total days").fill("10")
  await page.getByLabel("Price").fill("5000")
  await page.getByLabel("Start date").fill(TODAY)
  await page.getByRole("button", { name: "Save Package" }).click()
  await expect(page.getByText("Package created successfully")).toBeVisible()

  // Change status to paused
  await page.getByRole("button", { name: /Change Status/ }).first().click()
  await page.getByRole("option", { name: "paused" }).click()
  await page.getByRole("button", { name: "Update Status" }).click()
  await expect(page.getByText("Package updated successfully")).toBeVisible()

  await expect(page.getByText("paused")).toBeVisible()
})
