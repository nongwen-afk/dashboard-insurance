import { test, expect } from '@playwright/test';

// This file contains read-only smoke tests designed to safely run against the Production environment.

test.describe('Production Smoke Tests (Read-Only)', () => {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test('Database health check passes', async ({ request }) => {
    // Verify that the backend database is reachable
    const response = await request.get(`${baseUrl}/api/db/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toMatchObject({ ok: true });
  });

  test('Dashboard loads successfully without errors and displays core UI', async ({ page }) => {
    // Navigate to the main dashboard page
    await page.goto(baseUrl);

    // Verify the main heading exists to ensure the app didn't crash
    const heading = page.locator('h1');
    await expect(heading).toContainText('รายการเอกสารยานพาหนะ');
    
    // Verify header renders
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Verify no immediate error states from data fetching
    await expect(page.getByText('โหลดข้อมูลจาก Neon ไม่สำเร็จ')).toHaveCount(0);
    
    // Wait for the loading state to disappear
    await expect(page.getByText('กำลังโหลดข้อมูลจาก Neon...')).toBeHidden();

    // Verify stat cards are visible
    await expect(page.locator('text=เอกสารทั้งหมด').first()).toBeVisible();
    await expect(page.locator('text=ต่อแล้ว').first()).toBeVisible();
    await expect(page.locator('text=ใกล้ถึงรอบต่อ').first()).toBeVisible();
    await expect(page.locator('text=ยังไม่ต่อ').first()).toBeVisible();
  });
});
