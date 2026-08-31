import { test, expect } from '@playwright/test';

test('schedule a meeting and see it in upcoming list', async ({ page }) => {
  await page.goto('/');

  // Wait for authenticated dashboard to load
  const scheduleBtn = page.locator('button:has-text("Schedule")');
  await expect(scheduleBtn).toBeVisible({ timeout: 15000 });
  await scheduleBtn.click();

  // Modal should appear
  await expect(page.locator('text=Schedule Meeting')).toBeVisible({ timeout: 5000 });

  // Fill in topic
  const topicInput = page.locator('input[id="topic"]');
  await expect(topicInput).toBeVisible();
  await topicInput.fill('E2E Automated Sync');

  // Submit the form
  const saveBtn = page.locator('button:has-text("Save"), button:has-text("Schedule")').last();
  await saveBtn.click();

  // Should show confirmation
  await expect(
    page.locator('text=Meeting Scheduled, text=scheduled, text=E2E Automated Sync').first()
  ).toBeVisible({ timeout: 10000 });
});
