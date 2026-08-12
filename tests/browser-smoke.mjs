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

      if (viewport.name === 'desktop') {
        assert(await page.locator('.header-cta').isVisible(), 'desktop header CTA must be visible');
      } else {
        assert(!(await page.locator('.header-cta').isVisible()), 'desktop CTA should collapse on mobile');
        await page.locator('.menu-toggle').click();
        assert(await page.locator('.nav-cta').isVisible(), 'mobile menu must expose project CTA');
        await page.keyboard.press('Escape');
        assert(!(await page.locator('#site-nav').isVisible()), 'Escape must close mobile navigation');
      }

      await exercisePage(page);

      if (photo) {
        await page.waitForFunction(() => {
          const visibleOfficialImages = [...document.querySelectorAll('img.official-media')]
            .filter((img) => getComputedStyle(img).display !== 'none');
          return visibleOfficialImages.length >= 13 && visibleOfficialImages.every((img) => img.complete && img.naturalWidth > 0);
        }, { timeout: 20000 });
        assert(await page.locator('.official-hero-img').isVisible(), `${variant} must show official hero art`);
        assert.equal(await page.locator('.official-person').count(), 3, 'three official team portraits must be present');
        assert.equal(await page.locator('.official-case-art').count(), 5, 'five official case artworks must be present');
        assert.equal(await page.locator('.plan-media').count(), 3, 'three official tariff cards must be present');
      } else {
        assert(!(await page.locator('.official-hero-img').isVisible()), `${variant} must remain a pure art-direction preview`);
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 2, `${viewport.name}/${variant} has ${overflow}px horizontal overflow`);
      assert.deepEqual(pageErrors, [], `${viewport.name}/${variant} emitted page errors: ${pageErrors.join('; ')}`);

      await page.screenshot({ path: `artifacts/browser-qa/${viewport.name}-${variant}.png`, fullPage: true });
      await page.close();
    }
  }

  await browser.close();
  console.log('RIMA browser QA: OK — 10 variants × desktop/mobile');
} finally {
  server.kill('SIGTERM');
}
