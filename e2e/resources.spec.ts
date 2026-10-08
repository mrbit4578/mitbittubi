import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('project audit is discoverable from the transaction log and downloads completely', async ({ page }) => {
  await page.goto('/#audit');
  await page.getByRole('button', { name: 'Xem báo cáo Audit & Kaizen', exact: true }).click();
  await expect(page).toHaveURL(/#project-audit$/);
  await expect(page.getByRole('heading', { name: 'Audit & Kaizen dự án', exact: true })).toBeVisible();
  await expect(page.locator('.resource-body')).toContainText('P0');
  await expect(page.locator('.resource-body')).toContainText('Đối chiếu báo cáo Eclat 2024');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải nội dung (.md)', exact: true }).click();
  const file = await pending;
  expect(await readFile((await file.path())!, 'utf8')).toContain('Các ví dụ sai đã tái hiện');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Audit & Kaizen dự án', exact: true })).toBeVisible();
});

test('outline and sample export full content without changing business data', async ({ page }) => {
  await page.goto('/');
  const before = await page.evaluate(() => localStorage.getItem('esgHub.sandbox.v1'));
  await page.getByRole('button', { name: 'Mở khung báo cáo ESG', exact: true }).click();
  await expect(page.locator('.resource-body')).toContainText('2-30');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải bản đọc / in (.html)', exact: true }).click();
  const file = await pending;
  const html = await readFile((await file.path())!, 'utf8');
  expect(html).toContain('19. Kiểm tra trước phát hành');
  expect(html).toContain('<table>');
  await page.getByRole('button', { name: 'Xem báo cáo tham chiếu', exact: true }).click();
  await expect(page.locator('.resource-notice')).toContainText('THAM CHIẾU ECLAT 2024');
  await expect(page.locator('.resource-body')).toContainText('125.998,68');
  await expect(page.locator('.resource-body')).toContainText('SRC-01');
  await expect(page.locator('.resource-body a[href$="#page=69"]').first()).toHaveAttribute('href', /eclatglobal.*#page=69$/);
  const sourcePending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải KPI Eclat và ngoại lệ (.xlsx)', exact: true }).click();
  expect((await sourcePending).suggestedFilename()).toContain('Eclat_2024');
  await page.getByRole('button', { name: 'Mẫu giả định để tập nhập', exact: true }).click();
  await expect(page.locator('.resource-notice')).toContainText('MẪU GIẢ ĐỊNH');
  await expect(page.locator('.resource-body')).toContainText('3.236,64');
  await expect(page.locator('.resource-body')).toContainText('20. Cách dùng mẫu');
  const excelPending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải phụ lục mẫu (.xlsx)', exact: true }).click();
  expect((await excelPending).suggestedFilename()).toContain('GIA_DINH');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.resource-notice')).toBeVisible();
  await expect(page.locator('.resource-toc')).toBeHidden();
  await expect(page.locator('.resource-body')).toContainText('MẪU GIẢ ĐỊNH');
  expect(await page.evaluate(() => localStorage.getItem('esgHub.sandbox.v1'))).toBe(before);
});

test('mindmap, review loop and role instructions lead to the right screens on desktop and mobile', async ({ page }) => {
  await page.goto('/#guide');
  const node = page.getByRole('button', { name: 'Nhánh Ghi nhận', exact: true });
  await node.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.map-detail')).toContainText('Đăng ký nguồn trước');
  await page.locator('.map-detail').getByRole('button', { name: 'Mở Sổ bằng chứng', exact: true }).click();
  await expect(page).toHaveURL(/#evidence$/);
  await page.goto('/#guide');
  await page.getByLabel('Tôi đang làm vai trò', { exact: true }).selectOption('reviewer');
  await page.getByRole('button', { name: 'Bước 5', exact: true }).click();
  await expect(page.locator('.step-detail')).toContainText('Soát xét độc lập');
  await page.locator('.review-loop').getByRole('button').click();
  await expect(page.locator('.step-detail')).toContainText('Nhập và tự kiểm dữ liệu');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải mindmap (.svg)', exact: true }).click();
  const file = await pending; const svg = await readFile((await file.path())!, 'utf8');
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"'); expect(svg).toContain('Kaizen');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.mindmap-mobile')).toBeVisible();
  for (const route of ['guide', 'project-audit', 'report-kit', 'report-example']) {
    await page.goto(`/#${route}`);
    await expect(page.locator('#main-content .screen h2').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.goto('/#guide'); await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.guide-print-only')).toBeVisible();
  await expect(page.locator('.guide-print-only')).toContainText('8. Kaizen');
});
