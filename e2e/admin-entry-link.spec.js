import { test, expect } from "@playwright/test";

test.describe("Admin entry link (customer shell)", () => {
  test("guest does not see user-admin-dashboard-link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("user-admin-dashboard-link")).toHaveCount(0);
  });

  test("admin sees dashboard link after login", async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (admin profile.role in Supabase)");

    await page.goto("/");
    // Desktop: Profile is auth-gated → modal → Sign In. Mobile: header "Sign in".
    const mobileSignIn = page.getByRole("button", { name: "Sign in" });
    if (await mobileSignIn.isVisible().catch(() => false)) {
      await mobileSignIn.click();
    } else {
      await page.getByRole("button", { name: /^Profile$/ }).click();
      await page.getByRole("button", { name: "Sign In" }).click();
    }
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    const link = page.getByTestId("user-admin-dashboard-link");
    await expect(link).toBeVisible({ timeout: 20_000 });
    await expect(link).toHaveAttribute("href", /admin/);
  });
});
