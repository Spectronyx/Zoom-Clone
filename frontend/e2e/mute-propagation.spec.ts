import { test, expect } from '@playwright/test';

test('toggle mute and verify status icon update', async ({ page }) => {
  await page.goto('/');

  // Wait for authenticated dashboard and create a meeting
  const newMeetingBtn = page.locator('button:has-text("New Meeting")');
  await expect(newMeetingBtn).toBeVisible({ timeout: 15000 });
  await newMeetingBtn.click();

  // Handle lobby
  await expect(page).toHaveURL(/\/meeting\/.*\/lobby/, { timeout: 10000 });
  const nameInput = page.locator('input[placeholder*="name" i]');
  if (await nameInput.isVisible()) {
    await nameInput.fill('E2E Tester');
  }
  const joinBtn = page.locator('button:has-text("Join"), button:has-text("Ask to Join")');
  await expect(joinBtn).toBeVisible({ timeout: 5000 });
  await joinBtn.click();

  // Wait for meeting room to load
  await expect(page).toHaveURL(/\/meeting\//, { timeout: 10000 });
  await page.waitForTimeout(2000); // Let the room UI stabilize

  // Find and click mute button
  const muteBtn = page.locator('button:has-text("Mute")').first();
  await expect(muteBtn).toBeVisible({ timeout: 5000 });
  await muteBtn.click();

  // After clicking mute, it should show "Unmute"
  await expect(page.locator('button:has-text("Unmute")')).toBeVisible({ timeout: 5000 });
});
