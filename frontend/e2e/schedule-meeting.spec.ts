import { test, expect } from '@playwright/test';

test('schedule a meeting and see it in upcoming list', async ({ page }) => {
  await page.goto('/');

  // Wait for authenticated dashboard to load
  // Use the main content area Schedule button (not nav or dropdown)
  const scheduleBtn = page.getByRole('main').getByRole('button', { name: /^schedule$/i });
  await expect(scheduleBtn).toBeVisible({ timeout: 20000 });
  await scheduleBtn.click();

  // Modal should appear
  await expect(page.getByText('Schedule Meeting')).toBeVisible({ timeout: 5000 });

  // Fill in topic
  const topicInput = page.locator('input[id="topic"]');
  await expect(topicInput).toBeVisible();
  await topicInput.fill('E2E Automated Sync');

  // Submit the form
  const saveBtn = page.getByRole('button', { name: /save|schedule/i }).last();
  await saveBtn.click();

  // Should show confirmation or the meeting in the list
  await expect(
    page.getByText(/scheduled|E2E Automated Sync/i).first()
  ).toBeVisible({ timeout: 10000 });
});
