import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const concepts = ['editorial', 'cosmos', 'brutal', 'luxe', 'swiss'];
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

try {
  await waitForServer();
  await mkdir('artifacts/browser-qa', { recursive: true });
  const browser = await chromium.launch({ headless: true });

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    for (const concept of concepts) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));

      await page.goto(`http://127.0.0.1:4173/?concept=${concept}`, { waitUntil: 'networkidle' });
      await page.waitForFunction((expected) => document.body.dataset.concept === expected, concept);

      assert.equal(await page.locator('[data-set-concept]').count(), 5, 'all five concept controls must render');
      assert.equal(await page.locator('[data-set-concept].is-active').count(), 1, 'exactly one concept must be active');
      assert.equal(await page.locator(`[data-set-concept="${concept}"]`).getAttribute('aria-pressed'), 'true');
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

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 2, `${viewport.name}/${concept} has ${overflow}px horizontal overflow`);
      assert.deepEqual(pageErrors, [], `${viewport.name}/${concept} emitted page errors: ${pageErrors.join('; ')}`);

      await page.screenshot({ path: `artifacts/browser-qa/${viewport.name}-${concept}.png`, fullPage: true });
      await page.close();
    }
  }

  await browser.close();
  console.log('RIMA browser QA: OK — 5 concepts × desktop/mobile');
} finally {
  server.kill('SIGTERM');
}
