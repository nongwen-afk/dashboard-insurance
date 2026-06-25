import { expect, test } from '@playwright/test';

// This file writes and deletes data, so it should only run in Staging Pipeline against the Test DB.
// The tests are self-contained and clean up after themselves.

test.describe('Document CRUD Operations (Test DB Only)', () => {
  const testChassis = `TEST-CHASSIS-${Date.now()}`;
  const testLicensePlate = `TEST-${Math.floor(Math.random() * 9999)}`;

  test('can create a new document manually and delete it', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('กำลังโหลดข้อมูลจาก Neon...')).toBeHidden();

    // Listen to console logs
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    // 1. Open Add Document Modal
    await page.locator('button', { hasText: 'เพิ่มเอกสาร' }).first().click();
    
    const modal = page.locator('h3', { hasText: 'เพิ่มเอกสาร / งานต่ออายุใหม่' }); // Ensure we are targeting the modal
    await expect(page.locator('h3', { hasText: 'เพิ่มเอกสาร / งานต่ออายุใหม่' })).toBeVisible();

    // 2. Fill the manual form
    // We skip OCR scanning to keep the test fast and reliable
    await page.locator('input#chassis').fill(testChassis);
    await page.locator('input#licensePlate').fill(testLicensePlate);
    await page.locator('input#project').fill('Playwright Test Project');
    await page.locator('select#docType').selectOption('tax');
    
    // Fill dates
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);
    
    // Format YYYY-MM-DD
    const issuedStr = today.toISOString().split('T')[0];
    const expiryStr = nextYear.toISOString().split('T')[0];
    
    await page.locator('input#issuedDate').fill(issuedStr);
    await page.locator('input#expiryDate').fill(expiryStr);
    await page.locator('input#issuer').fill('Playwright Test Issuer');

    // 3. Submit the form
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/vehicle-documents') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'บันทึกข้อมูล' }).click()
    ]);
    const responseBody = await response.json().catch(() => ({}));
    console.log('API RESPONSE:', response.status(), responseBody);

    // Verify success toast
    await expect(page.getByText('เพิ่มเอกสารรถยนต์สำเร็จเรียบร้อย')).toBeVisible();
    await expect(modal).toBeHidden();

    // 4. Verify it appears in the table
    // We can use search to quickly find it
    const search = page.getByPlaceholder('ค้นหาทะเบียน, โครงการ, ประเภทเอกสาร...');
    await search.fill(testChassis);

    const newRow = page.locator('tbody tr').filter({ hasText: testChassis });
    await expect(newRow).toBeVisible();
    await expect(newRow.locator('text=' + testLicensePlate)).toBeVisible();

    // 5. Delete the document to clean up
    // Wait for the new row to be fully stabilized
    await page.waitForTimeout(500);

    // Setup dialog handler to accept window.confirm
    page.once('dialog', dialog => dialog.accept());

    // Click the delete button on the row
    // It's the last button in the row
    await newRow.locator('button').last().click();
    await page.locator('button', { hasText: 'ลบข้อมูลออกจากระบบ' }).click();

    // Verify delete success
    await expect(page.locator(`text=ลบข้อมูล ${testLicensePlate} ออกจาก Neon แล้ว`)).toBeVisible();

    // Verify it's gone from the table
    await expect(newRow).toBeHidden();
  });
});
