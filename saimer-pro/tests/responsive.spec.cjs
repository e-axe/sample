const { test, expect } = require('@playwright/test');
const paths = ['', 'talents/', 'about/', 'contact/', 'privacy/', ...['ishihara-yueto','nakayama-yui','tsukigata-hina','takashima-hiroki'].map(s => `talents/${s}/`)];

test.beforeEach(async ({ page }) => {
  // External font availability must not decide whether a deploy is safe.
  // These checks also cover the site's system-font fallback.
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
});
async function noOverflow(page) {
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(size.scroll, `${page.url()}: horizontal overflow`).toBeLessThanOrEqual(size.viewport + 1);
}

test('all nine pages render without overflow, missing local assets or runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:4174/') && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  for (const route of paths) {
    await page.goto(route, { waitUntil: 'load' });
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toBeVisible();
    await expect(page).toHaveTitle(/S'aimer/);
    await noOverflow(page);
    for (const row of await page.locator('.talent-social .social-row').all()) {
      await row.scrollIntoViewIfNeeded();
      const layout = await row.evaluate(el => {
        const edge = el.getBoundingClientRect();
        return [...el.children].every(n => { const r=n.getBoundingClientRect(); return r.left >= edge.left+12 && r.right <= edge.right-12; });
      });
      expect(layout, `${route}: social content needs inner gutters`).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});

test('mobile menu opens, traps focus, closes with Escape and navigates to Social', async ({ page }) => {
  test.skip(page.viewportSize().width >= 768, 'Desktop navigation is permanently visible');
  await page.goto('');
  const toggle = page.locator('[data-menu-toggle]');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(true);
  await page.locator('[data-menu] a').last().focus();
  await page.keyboard.press('Tab');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.locator('[data-menu] a[href="#social"]').click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#social')).toBeFocused();
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(false);
  await noOverflow(page);
});

test('portrait viewer fits viewport and restores scroll and focus', async ({ page }) => {
  await page.goto('talents/ishihara-yueto/');
  const trigger = page.locator('[data-gallery-open]');
  await trigger.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await trigger.click();
  const dialog = page.locator('dialog');
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.locator('.photo-viewer-image').evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true);
  const image = await page.locator('.photo-viewer-image').evaluate(i => ({ src:i.currentSrc, rect:i.getBoundingClientRect().toJSON() }));
  expect(image.src).toMatch(/\.webp$/);
  const box = await dialog.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height + 1);
  expect(image.rect.height).toBeGreaterThan(0);
  await page.getByRole('button', { name: '写真を閉じる', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThanOrEqual(2);
});

test('casting link carries talent into contact and selection updates email', async ({ page }) => {
  await page.goto('talents/nakayama-yui/');
  await page.locator('.talent-offer-link').click();
  await expect(page.locator('[data-inquiry-talent]')).toHaveValue('nakayama-yui');
  await expect(page.locator('[data-selected-talent]')).toContainText('中山 結心');
  await page.locator('[data-inquiry-type]').selectOption('press');
  const href = await page.locator('[data-mail-link]').getAttribute('href');
  expect(decodeURIComponent(href)).toContain('取材依頼');
  expect(decodeURIComponent(href)).toContain('中山 結心');
  await expect(page).toHaveURL(/type=press/);
  await page.reload();
  await expect(page.locator('[data-inquiry-type]')).toHaveValue('press');
  await page.locator('summary').click();
  await expect(page.locator('[data-inquiry-body]')).toBeVisible();
  await noOverflow(page);
});

test('200 percent text remains inside page', async ({ page }) => {
  for (const route of ['', 'talents/', 'talents/ishihara-yueto/', 'contact/', 'privacy/']) {
    await page.goto(route);
    await page.evaluate(() => {
      // Simulate text-only enlargement, including explicitly sized labels.
      const nodes = [...document.querySelectorAll('body *')].filter(el => [...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim()));
      const sizes = nodes.map(el => getComputedStyle(el).fontSize);
      nodes.forEach((el, i) => el.style.fontSize = `${parseFloat(sizes[i])*2}px`);
    });
    await noOverflow(page);
  }
});

test('navigation and email remain available without JavaScript', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: testInfo.project.use.viewport, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.goto('http://127.0.0.1:4174/saimer-pro/contact/');
  await expect(page.getByRole('link', { name: 'TALENTS', exact: true }).first()).toBeVisible();
  await expect(page.locator('[data-mail-link]')).toHaveAttribute('href','mailto:contact@saimer-pro.com');
  await noOverflow(page);
  await context.close();
});
