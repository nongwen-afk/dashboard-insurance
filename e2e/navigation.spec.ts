import { expect, test } from '@playwright/test';

test.describe('Navigation & Sidebar', () => {
  test('Header displays correct system name', async ({ page }) => {
    await page.goto('/');

    // Check Header Text
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.locator('text=EVT Admin Panel')).toBeVisible();
    await expect(header.locator('text=EVT').first()).toBeVisible();
  });

  test('Sidebar can be toggled using hamburger button', async ({ page, isMobile }) => {
    // If it's a mobile viewport, the sidebar starts hidden by default
    // We'll test toggle regardless, but it behaves differently on desktop vs mobile.
    // The sidebar has a fixed structure where clicking the menu toggles a translate class.
    
    await page.goto('/');
    
    // give time to render
    await expect(page.getByText('กำลังโหลดข้อมูลจาก Neon...')).toBeHidden();

    const hamburgerBtn = page.locator('button[title="ย่อ/ขยาย เมนู"]');
    const sidebar = page.locator('aside');

    if (isMobile) {
      // Starts hidden on mobile
      await expect(sidebar).toHaveClass(/translate-x-full/);
      
      // Click open
      await hamburgerBtn.click();
      await expect(sidebar).toHaveClass(/translate-x-0/);
      
      // Click close
      await hamburgerBtn.click();
      await expect(sidebar).toHaveClass(/translate-x-full/);
    } else {
      // Since default state of layout.tsx is isSidebarOpen=false, it starts hidden!
      // Let's verify it's hidden
      await expect(sidebar).toHaveClass(/translate-x-full/);
      
      // Click open
      await hamburgerBtn.click();
      await expect(sidebar).toHaveClass(/translate-x-0/);
      
      // Click close
      await hamburgerBtn.click();
      await expect(sidebar).toHaveClass(/translate-x-full/);
    }
  });

  test('Sidebar displays main menus', async ({ page }) => {
    await page.goto('/');

    // Ensure sidebar is open
    const hamburgerBtn = page.locator('button[title="ย่อ/ขยาย เมนู"]');
    await hamburgerBtn.click();

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    await expect(sidebar.locator('text=แดชบอร์ด')).toBeVisible();
    await expect(sidebar.locator('text=โครงการ')).toBeVisible();
    await expect(sidebar.locator('text=ยานพาหนะ').first()).toBeVisible();
    await expect(sidebar.locator('text=การเดินรถ')).toBeVisible();
    await expect(sidebar.locator('text=คนขับรถ')).toBeVisible();
    await expect(sidebar.locator('text=ซ่อมบำรุง')).toBeVisible();
  });

  test('Sidebar "ยานพาหนะ" submenus can be toggled', async ({ page }) => {
    await page.goto('/');

    const hamburgerBtn = page.locator('button[title="ย่อ/ขยาย เมนู"]');
    await hamburgerBtn.click();

    // In Sidebar.tsx, the 'vehicle' submenu is open by default (useState<string | null>('vehicle'))
    const vehicleMenuBtn = page.locator('button').filter({ hasText: 'ยานพาหนะ' });
    
    // Check submenus are visible initially
    await expect(page.locator('text=เอกสารยานพาหนะ')).toBeVisible();
    await expect(page.locator('text=รุ่นยานพาหนะ')).toBeVisible();
    await expect(page.locator('text=ผู้ให้บริการ GPS')).toBeVisible();

    // Click to collapse
    await vehicleMenuBtn.click();
    await expect(page.locator('text=รุ่นยานพาหนะ')).toBeHidden();

    // Click to expand again
    await vehicleMenuBtn.click();
    await expect(page.locator('text=รุ่นยานพาหนะ')).toBeVisible();
  });
});
