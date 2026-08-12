import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const bases = ['editorial', 'cosmos', 'brutal', 'luxe', 'swiss'];
const variants = [
  ...bases,
  ...bases.map((concept) => `${concept}-photo`),
  ...bases.map((concept) => `${concept}-motion`)
];
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
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 80));
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
      switcher: { left: box.left, right: box.right, width: box.width, height: box.height, overflowX: getComputedStyle(switcher).overflowX },
      buttons,
      rows
    };
  }, viewportWidth);
}

function parseVariant(variant) {
  const motion = variant.endsWith('-motion');
  const photo = variant.endsWith('-photo');
  const base = motion ? variant.slice(0, -7) : photo ? variant.slice(0, -6) : variant;
  return { base, motion, media: photo || motion ? 'official' : 'abstract' };
}

async function assertChooserContained(page, width, label) {
  const chooser = await inspectMobileChooser(page, width);
  assert(chooser.switcher.left >= 0, `${label} chooser starts off-screen: ${JSON.stringify(chooser)}`);
  assert(chooser.switcher.right <= width + 0.5, `${label} chooser ends off-screen: ${JSON.stringify(chooser)}`);
  assert(chooser.switcher.width <= width, `${label} chooser wider than viewport: ${JSON.stringify(chooser)}`);
  assert.equal(chooser.buttons.length, 15, `${label} must expose 15 chooser buttons`);
  assert.equal(chooser.rows.length, 3, `${label} must expose 3 chooser rows`);
  for (const [index, button] of chooser.buttons.entries()) {
    assert(button.left >= chooser.switcher.left - 0.5, `${label} button ${index} starts outside switcher`);
    assert(button.right <= chooser.switcher.right + 0.5, `${label} button ${index} ends outside switcher`);
    assert(button.width > 0, `${label} button ${index} collapsed`);
  }
  for (const [index, row] of chooser.rows.entries()) {
    assert(row.left >= chooser.switcher.left - 0.5 && row.right <= chooser.switcher.right + 0.5, `${label} row ${index} escapes switcher`);
    assert.notEqual(row.overflowX, 'scroll', `${label} row ${index} still scrolls`);
    assert.notEqual(row.overflowX, 'auto', `${label} row ${index} still auto-scrolls`);
  }
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
      const parsed = parseVariant(variant);
      await page.waitForFunction((expected) => document.body.dataset.variant === expected, variant);

      assert.equal(await page.locator('[data-set-concept]').count(), 15, 'all fifteen controls must render');
      assert.equal(await page.locator('[data-set-concept].is-active').count(), 1, 'exactly one variant must be active');
      assert.equal(await page.locator(`[data-set-concept="${variant}"]`).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('body').getAttribute('data-concept'), parsed.base);
      assert.equal(await page.locator('body').getAttribute('data-media'), parsed.media);
      assert.equal(await page.locator('body').getAttribute('data-motion'), parsed.motion ? 'on' : 'off');
      assert.equal(await page.locator('.projects-btn').getAttribute('href'), profilesUrl);
      assert(await page.locator('.hero-actions .primary-btn').isVisible(), 'hero CTA must stay visible');
      assert(await page.locator('.hero-actions .secondary-btn').isVisible(), 'cases CTA must stay visible');
      assert(await page.locator('#contact .contact-btn').isVisible(), 'contact CTA must render');
      assert(await page.locator('.hero-art .planet').isVisible(), `${variant} must keep orbit hero`);

      if (parsed.motion) {
        await page.waitForFunction(() => document.body.dataset.motionReady === 'true');
        assert.equal(await page.locator('body').getAttribute('data-motion-language'), parsed.base);
        assert(await page.locator('body').evaluate((node) => node.classList.contains('motion-enhanced')), `${variant} motion enhancement not initialized`);
        const runningAnimations = await page.evaluate(() => document.getAnimations().length);
        assert(runningAnimations > 0, `${variant} should initialize CSS motion`);
      } else {
        assert.equal(await page.locator('body').getAttribute('data-motion-ready'), null, `${variant} must not initialize motion layer`);
      }

      if (viewport.name === 'desktop') {
        assert(await page.locator('.header-cta').isVisible(), 'desktop header CTA must be visible');
      } else {
        assert(!(await page.locator('.header-cta').isVisible()), 'desktop CTA should collapse on mobile');
        await page.locator('.menu-toggle').click();
        assert(await page.locator('.nav-cta').isVisible(), 'mobile menu must expose project CTA');
        await page.keyboard.press('Escape');
        assert(!(await page.locator('#site-nav').isVisible()), 'Escape must close mobile navigation');
        assert.equal(await page.locator('[data-concept-toggle]').getAttribute('aria-expanded'), 'false', 'mobile chooser should start collapsed');
        await page.locator('[data-concept-toggle]').click();
        assert.equal(await page.locator('[data-concept-toggle]').getAttribute('aria-expanded'), 'true', 'mobile chooser must expand');
        await assertChooserContained(page, viewport.width, variant);
        await page.screenshot({ path: `artifacts/browser-qa/mobile-ui-${variant}.png` });
        await page.locator('[data-concept-toggle]').click();
        assert.equal(await page.locator('[data-concept-toggle]').getAttribute('aria-expanded'), 'false', 'mobile chooser must collapse again');
      }

      await exercisePage(page);

      if (parsed.media === 'official') {
        const media = await inspectOfficialMedia(page);
        assert.equal(media.length, 8, `${variant} must hydrate 8 official images`);
        const broken = media.filter((img) => !img.complete || !img.httpOk || img.width <= 1 || img.height <= 1);
        assert.deepEqual(broken, [], `${viewport.name}/${variant} has broken official media: ${JSON.stringify(broken)}`);
        const brokenRaster = media.filter((img) => !img.src.endsWith('.svg') && (img.naturalWidth <= 0 || img.naturalHeight <= 0));
        assert.deepEqual(brokenRaster, [], `${viewport.name}/${variant} has undecodable raster media: ${JSON.stringify(brokenRaster)}`);
        assert.equal(await page.locator('.official-person').count(), 3);
        assert.equal(await page.locator('.official-case-art').count(), 5);
        assert(await page.locator('.taiga-progress').isVisible(), `${variant} must show TAIGA 99% art`);
        assert.equal(await page.locator('.taiga-progress-value strong').textContent(), '99');
        assert.equal(await page.locator('.plan-visual').count(), 3);
        for (const node of await page.locator('.plan-visual').all()) {
          assert(await node.isVisible(), `${variant} tariff visual must be visible`);
        }
        assert(await page.locator('.sputnik-signature').isVisible(), `${variant} must show Sputnik signature`);
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

  for (const width of [320, 360, 375, 390, 430]) {
    for (const base of bases) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const variant = `${base}-motion`;
      await page.goto(`http://127.0.0.1:4173/?concept=${variant}`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.body.dataset.motionReady === 'true');
      await page.locator('[data-concept-toggle]').click();
      await assertChooserContained(page, width, `${width}px/${variant}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 2, `${width}px/${variant} has ${overflow}px horizontal overflow`);
      await page.close();
    }
  }

  for (const base of bases) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:4173/?concept=${base}-motion`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.body.dataset.motionReady === 'true');
    const hidden = await page.evaluate(() => [...document.querySelectorAll('.motion-node')].filter((node) => {
      const style = getComputedStyle(node);
      return style.opacity === '0' || style.visibility === 'hidden';
    }).length);
    assert.equal(hidden, 0, `${base}-motion reduced-motion must not hide content`);
    await context.close();
  }

  await browser.close();
  console.log('RIMA browser QA: OK — 15 variants × desktop/mobile + collapsible chooser + 5-width sweep + reduced-motion');
} finally {
  server.kill('SIGTERM');
}
