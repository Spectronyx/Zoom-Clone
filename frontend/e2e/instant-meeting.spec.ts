import { test, expect } from '@playwright/test';

test('start instant meeting and verify room UI loads', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("New Meeting")');
  await expect(page).toHaveURL(/\/meeting\/[0-9]+\/lobby/);
  await page.click('button:has-text("Join Meeting")');
  await expect(page).toHaveURL(/\/meeting\/[0-9]+/);
  await expect(page.locator('button:has-text("Leave")')).toBeVisible();
});
