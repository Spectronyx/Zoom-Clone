import { test, expect } from '@playwright/test';

test('schedule a meeting and see it in upcoming list', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Schedule")');
  await expect(page.locator('text=Schedule Meeting')).toBeVisible();

  await page.fill('input[id="topic"]', 'E2E Automated Sync');
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Meeting Scheduled')).toBeVisible();
  await page.click('button:has-text("Done")');

  await expect(page.locator('text=E2E Automated Sync')).toBeVisible();
});
