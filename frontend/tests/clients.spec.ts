import { expect, test } from "@playwright/test"

const randomPhone = () =>
  `555${Math.random().toString().slice(2, 11)}`.slice(0, 12)

const randomClientName = () =>
  `Client ${Math.random().toString(36).substring(2, 8)}`

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
