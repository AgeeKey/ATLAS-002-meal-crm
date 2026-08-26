import { expect, test } from "@playwright/test"

test("Items route redirects to clients", async ({ page }) => {
  await page.goto("/items")
  await expect(page).toHaveURL(/\/clients$/)
  await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible()
})

test("Redirected items route does not show legacy item UI", async ({ page }) => {
  await page.goto("/items")
  await expect(page).toHaveURL(/\/clients$/)
  await expect(page.getByRole("button", { name: "Add Client" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Add Item" })).toHaveCount(0)
})
