import { test, expect } from '@playwright/test';

test('send chat message and verify in chat panel', async ({ page }) => {
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

  // Open chat panel
  const chatBtn = page.locator('button:has-text("Chat")');
  await expect(chatBtn).toBeVisible({ timeout: 5000 });
  await chatBtn.click();

  // Verify chat panel opened
  await expect(page.locator('text=Chat, text=chat').first()).toBeVisible({ timeout: 5000 });

  // Type and send a message
  const chatInput = page.locator('input[placeholder*="message" i], input[placeholder*="type" i]');
  await expect(chatInput).toBeVisible({ timeout: 5000 });
  await chatInput.fill('Hello E2E Test');
  await chatInput.press('Enter');

  // Verify message appears
  await expect(page.locator('text=Hello E2E Test')).toBeVisible({ timeout: 5000 });
});
