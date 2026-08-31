import { test, expect } from '@playwright/test';

test('start instant meeting and verify room UI loads', async ({ page }) => {
  await page.goto('/');

  // Wait for authenticated dashboard to load (API call fetches user)
  const newMeetingBtn = page.locator('button:has-text("New Meeting")');
  await expect(newMeetingBtn).toBeVisible({ timeout: 15000 });
  await newMeetingBtn.click();

  // Should navigate to lobby
  await expect(page).toHaveURL(/\/meeting\/.*\/lobby/, { timeout: 10000 });

  // Fill name if empty and join
  const nameInput = page.locator('input[placeholder*="name" i]');
  if (await nameInput.isVisible()) {
    await nameInput.fill('E2E Tester');
  }

  const joinBtn = page.locator('button:has-text("Join"), button:has-text("Ask to Join")');
  await expect(joinBtn).toBeVisible({ timeout: 5000 });
  await joinBtn.click();

  // Should navigate to meeting room
  await expect(page).toHaveURL(/\/meeting\//, { timeout: 10000 });
  await expect(page.locator('button:has-text("Leave"), button:has-text("End")')).toBeVisible({ timeout: 10000 });
});
