import { test, expect } from '@playwright/test';

test.describe('Production Smoke Tests (Read-Only)', () => {
  test('Dashboard loads successfully and displays the correct title', async ({ page }) => {
    // Navigate to the main dashboard page
    // Note: Playwright usually uses baseURL from config, otherwise we default to local dev for fallback
    const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
    await page.goto(baseUrl);

    // Verify the page title or main heading exists to ensure the app didn't crash
    // Since this runs against Production, we only do non-destructive read operations
    await expect(page).toHaveTitle(/Fleet Dashboard/i);
    
    // Optionally wait for a core element to render (e.g. navigation or header)
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });
});
