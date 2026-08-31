import { test, expect } from '@playwright/test';

test('toggle mute and verify status icon update', async ({ page }) => {
  await page.goto('/');

  // Wait for authenticated dashboard and create a meeting
  const newMeetingBtn = page.getByRole('main').getByRole('button', { name: /new meeting/i });
  await expect(newMeetingBtn).toBeVisible({ timeout: 20000 });
  await newMeetingBtn.click();

  // Handle lobby
  await expect(page).toHaveURL(/\/meeting\/.*\/lobby/, { timeout: 15000 });
  const nameInput = page.locator('input[placeholder*="name" i]');
  if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nameInput.fill('E2E Tester');
  }
  const joinBtn = page.getByRole('button', { name: /join|ask to join/i });
  await expect(joinBtn).toBeVisible({ timeout: 5000 });
  await joinBtn.click();

  // Wait for meeting room to load
  await expect(page).toHaveURL(/\/meeting\//, { timeout: 15000 });
  await page.waitForTimeout(2000); // Let room UI stabilize

  // Find and click mute button
  const muteBtn = page.getByRole('button', { name: /^mute$/i });
  await expect(muteBtn).toBeVisible({ timeout: 5000 });
  await muteBtn.click();

  // After clicking mute, it should show "Unmute"
  await expect(page.getByRole('button', { name: /unmute/i })).toBeVisible({ timeout: 5000 });
});
