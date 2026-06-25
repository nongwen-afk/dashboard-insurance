import { expect, test } from '@playwright/test';

test.describe('Policy Table', () => {
  test('displays correct table headers', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('กำลังโหลดข้อมูลจาก Neon...')).toBeHidden();

    // Check table headers
    const table = page.locator('table');
    await expect(table.locator('th').filter({ hasText: 'ประเภทเอกสาร' })).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'เลขตัวถัง' })).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'ทะเบียนรถ' })).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'โครงการ' })).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'วันหมดอายุ' })).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'สถานะ' })).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'ไฟล์แนบ' })).toBeVisible();
  });

  test('can filter by document type', async ({ page, request }) => {
    const response = await request.get('/api/vehicle-documents');
    const { documents } = await response.json();
    test.skip(!documents.length, 'The test database has no vehicle documents.');

    await page.goto('/');
    await expect(page.getByText('กำลังโหลดข้อมูลจาก Neon...')).toBeHidden();

    // Click filter button
    await page.locator('button', { hasText: 'ตัวกรอง' }).click();

    // Click "พ.ร.บ." filter
    await page.locator('button', { hasText: 'พ.ร.บ.' }).click();

    // The table should only show rows with "พ.ร.บ."
    // We check that rows without "พ.ร.บ." but with "ภาษี" are hidden, if they exist
    // Alternatively, verify that the active filter is applied
    await expect(page.getByText('ล้างตัวกรอง')).toBeVisible();
  });

  test('can sort documents', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('กำลังโหลดข้อมูลจาก Neon...')).toBeHidden();

    // Click sort button
    await page.locator('button', { hasText: 'จัดเรียง' }).click();

    // Select 'วันหมดอายุ (น้อยไปมาก)'
    await page.locator('button', { hasText: 'วันหมดอายุ (น้อยไปมาก)' }).click();

    // Wait a bit for sorting to apply
    await page.waitForTimeout(500);

    // Click sort button again
    await page.locator('button', { hasText: 'จัดเรียง' }).click();
    
    // Select 'วันหมดอายุ (มากไปน้อย)'
    await page.locator('button', { hasText: 'วันหมดอายุ (มากไปน้อย)' }).click();
  });

  test('clicking a row opens DocumentDetailModal', async ({ page, request }) => {
    const response = await request.get('/api/vehicle-documents');
    const { documents } = await response.json();
    test.skip(!documents.length, 'The test database has no vehicle documents.');

    await page.goto('/');
    await expect(page.getByText('กำลังโหลดข้อมูลจาก Neon...')).toBeHidden();

    // Click the first table row
    // Locate the table body and click its first row
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    // The DocumentDetailModal should open
    // Wait for the modal title to appear
    await expect(page.locator('h3', { hasText: 'รายละเอียดเอกสาร' })).toBeVisible();

    // Close the modal
    await page.locator('button[title="ปิดหน้าต่าง"]').click();
    await expect(page.locator('h3', { hasText: 'รายละเอียดเอกสาร' })).toBeHidden();
  });
});
