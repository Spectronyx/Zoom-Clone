import { test, expect } from '@playwright/test';

test('start instant meeting and verify room UI loads', async ({ page }) => {
  await page.goto('/');

  // Wait for authenticated dashboard to load (API call fetches user via proxy)
  const hostBtn = page.getByRole('button', { name: /^host$/i }).first();
  await expect(hostBtn).toBeVisible({ timeout: 20000 });
  await hostBtn.click();

  // Should navigate to lobby
  await expect(page).toHaveURL(/\/meeting\/.*\/lobby/, { timeout: 15000 });

  // Fill name if empty and join
  const nameInput = page.locator('input[placeholder*="name" i]');
  if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nameInput.fill('E2E Tester');
  }

  const joinBtn = page.getByRole('button', { name: /join|ask to join/i }).first();
  await expect(joinBtn).toBeVisible({ timeout: 5000 });
  await joinBtn.click();

  // Should navigate to meeting room
  await expect(page).toHaveURL(/\/meeting\//, { timeout: 15000 });
  const leaveBtn = page.getByRole('button', { name: /leave|end/i });
  await expect(leaveBtn).toBeVisible({ timeout: 15000 });
});
