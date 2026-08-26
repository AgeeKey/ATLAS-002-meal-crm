import { expect, test as setup } from "@playwright/test"
import { firstSuperuser, firstSuperuserPassword } from "./config.ts"

const authFile = "playwright/.auth/user.json"

setup("authenticate", async ({ page }) => {
  await page.goto("/login")
  await page.getByTestId("email-input").fill(firstSuperuser)
  await page.getByTestId("password-input").fill(firstSuperuserPassword)
  await page.getByRole("button", { name: "Log In" }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(
    page.getByText("Welcome back, nice to see you again!"),
  ).toBeVisible()
  await page.context().storageState({ path: authFile })
})
