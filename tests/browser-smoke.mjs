import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const bases = ['editorial', 'cosmos', 'brutal', 'luxe', 'swiss'];
const variants = [...bases, ...bases.map((concept) => `${concept}-photo`)];
const profilesUrl = 'https://www.behance.net/sputnikagency';
const server = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1'], { stdio: 'ignore' });

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const response = await fetch('http://127.0.0.1:4173/');
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('preview server did not start');
}

async function exercisePage(page) {
  await page.evaluate(async () => {
    const step = Math.max(500, Math.floor(window.innerHeight * 0.75));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    window.scrollTo(0, 0);
  });
}

async function inspectOfficialMedia(page) {
  await page.waitForFunction(
    () => [...document.querySelectorAll('img.official-media')].every((img) => img.complete),
    undefined,
    { timeout: 20000 }
  );

  return page.evaluate(async () => {
    const images = [...document.querySelectorAll('img.official-media')];
    return Promise.all(images.map(async (img) => {
      const rect = img.getBoundingClientRect();
      let httpOk = false;
      let status = 0;
      try {
        const response = await fetch(img.currentSrc || img.src, { cache: 'no-store' });
        httpOk = response.ok;
        status = response.status;
      } catch {}
      return {
        src: img.getAttribute('src'),
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        width: rect.width,
        height: rect.height,
        display: getComputedStyle(img).display,
        httpOk,
        status
      };
    }));
  });
}

async function inspectMobileChooser(page, viewportWidth) {
  return page.evaluate((width) => {
    const switcher = document.querySelector('.concept-switcher');
    const box = switcher.getBoundingClientRect();
    const buttons = [...switcher.querySelectorAll('[data-set-concept]')].map((button) => {
      const rect = button.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    });
    const rows = [...switcher.querySelectorAll('.concept-row')].map((row) => {
      const rect = row.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width, overflowX: getComputedStyle(row).overflowX };
    });
    return {
      viewportWidth: width,
      switcher: { left: box.left, right: box.right, width: box.width, overflowX: getComputedStyle(switcher).overflowX },
      buttons,
      rows
    };
  }, viewportWidth);
}

try {
  await waitForServer();
  await mkdir('artifacts/browser-qa', { recursive: true });
  const browser = await chromium.launch({ headless: true });

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    for (const variant of variants) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));

      await page.goto(`http://127.0.0.1:4173/?concept=${variant}`, { waitUntil: 'networkidle' });
      const photo = variant.endsWith('-photo');
      const base = photo ? variant.slice(0, -6) : variant;
      await page.waitForFunction((expected) => document.body.dataset.variant === expected, variant);

      assert.equal(await page.locator('[data-set-concept]').count(), 10, 'all ten concept controls must render');
      assert.equal(await page.locator('[data-set-concept].is-active').count(), 1, 'exactly one variant must be active');
      assert.equal(await page.locator(`[data-set-concept="${variant}"]`).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('body').getAttribute('data-concept'), base, 'base art direction must stay stable');
      assert.equal(await page.locator('body').getAttribute('data-media'), photo ? 'official' : 'abstract');
      assert.equal(await page.locator('.projects-btn').getAttribute('href'), profilesUrl, 'all-projects CTA must target studio Behance');
      assert(await page.locator('.hero-actions .primary-btn').isVisible(), 'hero project CTA must stay visible');
      assert(await page.locator('.hero-actions .secondary-btn').isVisible(), 'hero cases CTA must stay visible');
      assert(await page.locator('#contact .contact-btn').isVisible(), 'final contact CTA must render');
      assert(await page.locator('.hero-art .planet').isVisible(), `${variant} must keep the orbit hero`);

      if (viewport.name === 'desktop') {
        assert(await page.locator('.header-cta').isVisible(), 'desktop header CTA must be visible');
      } else {
        assert(!(await page.locator('.header-cta').isVisible()), 'desktop CTA should collapse on mobile');
        await page.locator('.menu-toggle').click();
        assert(await page.locator('.nav-cta').isVisible(), 'mobile menu must expose project CTA');
        await page.keyboard.press('Escape');
        assert(!(await page.locator('#site-nav').isVisible()), 'Escape must close mobile navigation');

        const chooser = await inspectMobileChooser(page, viewport.width);
        assert(chooser.switcher.left >= 0, `${variant} chooser starts off-screen: ${JSON.stringify(chooser)}`);
        assert(chooser.switcher.right <= viewport.width + 0.5, `${variant} chooser ends off-screen: ${JSON.stringify(chooser)}`);
        assert(chooser.switcher.width <= viewport.width, `${variant} chooser wider than viewport: ${JSON.stringify(chooser)}`);
        for (const [index, button] of chooser.buttons.entries()) {
          assert(button.left >= chooser.switcher.left - 0.5, `${variant} chooser button ${index} starts outside switcher: ${JSON.stringify(chooser)}`);
          assert(button.right <= chooser.switcher.right + 0.5, `${variant} chooser button ${index} ends outside switcher: ${JSON.stringify(chooser)}`);
          assert(button.width > 0, `${variant} chooser button ${index} collapsed: ${JSON.stringify(chooser)}`);
        }
        for (const [index, row] of chooser.rows.entries()) {
          assert(row.left >= chooser.switcher.left - 0.5 && row.right <= chooser.switcher.right + 0.5, `${variant} chooser row ${index} escapes switcher: ${JSON.stringify(chooser)}`);
          assert.notEqual(row.overflowX, 'scroll', `${variant} chooser row ${index} still uses horizontal scroll`);
          assert.notEqual(row.overflowX, 'auto', `${variant} chooser row ${index} still uses horizontal auto-scroll`);
        }
        await page.screenshot({ path: `artifacts/browser-qa/mobile-ui-${variant}.png` });
      }

      await exercisePage(page);

      if (photo) {
        const media = await inspectOfficialMedia(page);
        assert.equal(media.length, 8, `${variant} must hydrate exactly 8 retained official images`);
        const broken = media.filter((img) => !img.complete || !img.httpOk || img.width <= 1 || img.height <= 1);
        assert.deepEqual(broken, [], `${viewport.name}/${variant} has broken official media: ${JSON.stringify(broken)}`);
        const brokenRaster = media.filter((img) => !img.src.endsWith('.svg') && (img.naturalWidth <= 0 || img.naturalHeight <= 0));
        assert.deepEqual(brokenRaster, [], `${viewport.name}/${variant} has undecodable raster media: ${JSON.stringify(brokenRaster)}`);
        assert.equal(await page.locator('.official-person').count(), 3, 'three official team portraits must be present');
        assert.equal(await page.locator('.official-case-art').count(), 5, 'five official case artworks must be present');
        assert(await page.locator('.taiga-progress').isVisible(), `${variant} must show TAIGA 99% loading art`);
        assert.equal(await page.locator('.taiga-progress-value strong').textContent(), '99');
        assert.equal(await page.locator('.plan-visual').count(), 3, 'three generated tariff visuals must be present');
        for (const node of await page.locator('.plan-visual').all()) {
          assert(await node.isVisible(), `${variant} tariff visual must be visible`);
        }
        assert(await page.locator('.sputnik-signature').isVisible(), `${variant} must show native Sputnik agency signature`);
        assert.equal(await page.locator('.official-hero-img').count(), 0, 'photo hero image must be removed');
        assert.equal(await page.locator('.plan-media').count(), 0, 'source tariff screenshots must be removed');
        assert.equal(await page.locator('.contact-brand').count(), 0, 'source agency-mark screenshot must be removed');
      } else {
        assert(!(await page.locator('.taiga-progress').isVisible()), `${variant} must keep original TAIGA art`);
        assert(!(await page.locator('.plan-visual').first().isVisible()), `${variant} must keep original tariff rows`);
        assert(!(await page.locator('.sputnik-signature').isVisible()), `${variant} must keep original contact treatment`);
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 2, `${viewport.name}/${variant} has ${overflow}px horizontal overflow`);
      assert.deepEqual(pageErrors, [], `${viewport.name}/${variant} emitted page errors: ${pageErrors.join('; ')}`);

      await page.screenshot({ path: `artifacts/browser-qa/${viewport.name}-${variant}.png`, fullPage: true });
      await page.close();
    }
  }

  await browser.close();
  console.log('RIMA browser QA: OK — 10 variants × desktop/mobile with contained mobile chooser');
} finally {
  server.kill('SIGTERM');
}
