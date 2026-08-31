import { test, expect } from '@playwright/test';

test('send chat message and verify in chat panel', async ({ page }) => {
  await page.goto('/');

  // Wait for authenticated dashboard and click Host button
  const hostBtn = page.getByRole('button', { name: /^host$/i }).first();
  await expect(hostBtn).toBeVisible({ timeout: 20000 });
  await hostBtn.click();

  // Handle lobby
  await expect(page).toHaveURL(/\/meeting\/.*\/lobby/, { timeout: 15000 });
  const nameInput = page.locator('input[placeholder*="name" i]');
  if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nameInput.fill('E2E Tester');
  }
  const joinBtn = page.getByRole('button', { name: /join|ask to join/i }).first();
  await expect(joinBtn).toBeVisible({ timeout: 5000 });
  await joinBtn.click();

  // Wait for meeting room to load
  await expect(page).toHaveURL(/\/meeting\//, { timeout: 15000 });
  await page.waitForTimeout(2000); // Let room UI stabilize

  // Open chat panel
  const chatBtn = page.getByRole('button', { name: /chat/i });
  await expect(chatBtn).toBeVisible({ timeout: 5000 });
  await chatBtn.click();

  // Verify chat panel opened
  await expect(page.getByText(/chat/i).first()).toBeVisible({ timeout: 5000 });

  // Type and send a message
  const chatInput = page.locator('input[placeholder*="message" i], input[placeholder*="type" i]');
  await expect(chatInput).toBeVisible({ timeout: 5000 });
  await chatInput.fill('Hello E2E Test');
  await chatInput.press('Enter');

  // Verify message appears
  await expect(page.getByText('Hello E2E Test')).toBeVisible({ timeout: 5000 });
});
