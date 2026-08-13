import { test, expect } from '@playwright/test';

test('send chat message and verify in chat panel', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("New Meeting")');
  await page.click('button:has-text("Join Meeting")');

  await page.click('button:has-text("Chat")');
  await expect(page.locator('text=In-Meeting Chat')).toBeVisible();

  await page.fill('input[placeholder="Type a message..."]', 'Hello E2E Test');
  await page.keyboard.press('Enter');

  await expect(page.locator('text=Hello E2E Test')).toBeVisible();
});
