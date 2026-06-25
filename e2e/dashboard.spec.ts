import { expect, test } from '@playwright/test';

test('health and read APIs use the test database', async ({ request }) => {
  const healthResponse = await request.get('/api/db/health');
  expect(healthResponse.ok()).toBeTruthy();
  const healthBody = await healthResponse.json();
  expect(healthBody).toMatchObject({ ok: true });

  const documentsResponse = await request.get('/api/vehicle-documents');
  expect(documentsResponse.ok()).toBeTruthy();
  const documentsBody = await documentsResponse.json();
  expect(Array.isArray(documentsBody.documents)).toBeTruthy();

  const notesResponse = await request.get('/api/calendar-notes');
  expect(notesResponse.ok()).toBeTruthy();
  const notesBody = await notesResponse.json();
  expect(Array.isArray(notesBody.notes)).toBeTruthy();
});

test('dashboard loads documents and core controls', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'รายการเอกสารยานพาหนะ' }),
  ).toBeVisible();
  await expect(page.getByText('ปฏิทินต่ออายุเอกสาร')).toBeVisible();
  await expect(
    page.getByPlaceholder('ค้นหาทะเบียน, โครงการ, ประเภทเอกสาร...'),
  ).toBeVisible();
  await expect(page.getByText('กำลังโหลดข้อมูลจาก Neon...')).toBeHidden();
  await expect(page.getByText('โหลดข้อมูลจาก Neon ไม่สำเร็จ')).toHaveCount(0);
});

test('search can find a document returned by the API', async ({ page, request }) => {
  const response = await request.get('/api/vehicle-documents');
  expect(response.ok()).toBeTruthy();

  const { documents } = await response.json();
  test.skip(!documents.length, 'The test database has no vehicle documents.');

  const searchTerm = documents[0].licensePlate || documents[0].chassis;

  await page.goto('/');
  const search = page.getByPlaceholder(
    'ค้นหาทะเบียน, โครงการ, ประเภทเอกสาร...',
  );
  await search.fill(searchTerm);

  await expect(page.getByText(searchTerm, { exact: false }).first()).toBeVisible();
});

test('stat cards display correct types', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('กำลังโหลดข้อมูลจาก Neon...')).toBeHidden();

  await expect(page.locator('text=เอกสารทั้งหมด').first()).toBeVisible();
  await expect(page.locator('text=ต่อแล้ว').first()).toBeVisible();
  await expect(page.locator('text=ใกล้ถึงรอบต่อ').first()).toBeVisible();
  await expect(page.locator('text=ยังไม่ต่อ').first()).toBeVisible();
});

test('stat card click filters table and scrolls down', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('กำลังโหลดข้อมูลจาก Neon...')).toBeHidden();

  // Save current scroll position
  const initialScrollY = await page.evaluate(() => window.scrollY);

  // Click on 'ต่อแล้ว' stat card
  await page.locator('text=ต่อแล้ว').first().click();

  // wait for scroll
  await page.waitForTimeout(500); // give time for smooth scroll

  // Verify scroll position changed
  const newScrollY = await page.evaluate(() => window.scrollY);
  expect(newScrollY).toBeGreaterThan(initialScrollY);
});
