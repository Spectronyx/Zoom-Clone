import { test, expect } from '@playwright/test';

test('toggle mute and verify status icon update', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("New Meeting")');
  await page.click('button:has-text("Join Meeting")');

  await page.click('button:has-text("Mute")');
  await expect(page.locator('button:has-text("Unmute")')).toBeVisible();
});
