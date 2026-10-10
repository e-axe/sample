// Run with Playwright installed. CHROMIUM_EXECUTABLE and PLAYWRIGHT_MODULE
// may select an existing runtime; VIEWER_QA_OUTPUT selects the JSON report.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const site = path.resolve(__dirname, '..');
const root = path.dirname(site);

(async () => {
  const server = http.createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (file.endsWith('/')) file += 'index.html';
    try {
      res.setHeader('Content-Type', {'.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'application/javascript', '.webp':'image/webp', '.woff2':'font/woff2', '.svg':'image/svg+xml'}[path.extname(file)] || 'application/octet-stream');
      res.end(fs.readFileSync(file));
    } catch { res.statusCode = 404; res.end('not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
    headless: true,
    ignoreDefaultArgs: ['--hide-scrollbars'],
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote', '--disable-features=OverlayScrollbar,OverlayScrollbars,FluentOverlayScrollbar']
  });
  const report = {browser: browser.version(), deviceScaleFactor: 1, rows: [], errors: []};
  try {
    const cases = [];
    for (const mode of ['classic', 'hidden']) {
      for (const [width, height] of [[1440,900], [1280,600], [1920,1080]]) cases.push({mode,width,height});
    }
    cases.push({mode:'classic',width:390,height:844}, {mode:'hidden',width:844,height:390});
    for (const test of cases) {
      const context = await browser.newContext({viewport:{width:test.width,height:test.height},deviceScaleFactor:1});
      const page = await context.newPage();
      page.on('pageerror', error => report.errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`); });
      await page.goto(`http://127.0.0.1:${server.address().port}/${path.basename(site)}/`, {waitUntil:'networkidle'});
      await page.evaluate(() => document.fonts.ready);
      if (test.mode === 'hidden') await page.addStyleTag({content:'.viewer-stage{scrollbar-width:none}.viewer-stage::-webkit-scrollbar{display:none}'});
      const trigger = page.locator('.flyer-image-link').first();
      await trigger.evaluate(link => link.addEventListener('pointerdown', () => { document.body.dataset.testScroll = String(scrollY); }, {once:true}));
      await trigger.click();
      await page.waitForFunction(() => !document.querySelector('.viewer-image').hidden && !document.querySelector('.viewer-zoom').disabled);
      await page.waitForTimeout(220);
      const result = await page.evaluate(async () => {
        const stage = document.querySelector('.viewer-stage');
        const image = document.querySelector('.viewer-image');
        const button = document.querySelector('.viewer-zoom');
        const rect = element => { const r = element.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; };
        const sample = () => ({
          zoom: button.getAttribute('aria-pressed'), image: rect(image), stage: rect(stage), button: rect(button),
          scrollWidth: stage.scrollWidth, scrollHeight: stage.scrollHeight,
          clientWidth: stage.clientWidth, clientHeight: stage.clientHeight,
          scrollLeft: stage.scrollLeft, scrollTop: stage.scrollTop
        });
        const rounds = [];
        for (let n = 0; n < 32; n++) {
          // Mix image and button activation, including a panned zoomed view.
          if (n >= 24) image.click(); else button.click();
          const frames = [sample()];
          for (let frame = 0; frame < 6; frame++) { await new Promise(resolve => requestAnimationFrame(resolve)); frames.push(sample()); }
          rounds.push({n,first:frames[0],last:frames.at(-1),
            maxSizeChange:Math.max(...frames.map(f => Math.abs(f.image.width-frames[0].image.width))),
            maxPositionChange:Math.max(...frames.map(f => Math.max(Math.abs(f.image.x-frames[0].image.x),Math.abs(f.image.y-frames[0].image.y))))});
          if (button.getAttribute('aria-pressed') === 'true') { stage.scrollTop = stage.scrollHeight; stage.scrollLeft = stage.scrollWidth; }
        }
        // Rapid changes must resolve to the same fitted state, without a stale callback.
        for (let n = 0; n < 40; n++) button.click();
        for (let frame = 0; frame < 6; frame++) await new Promise(resolve => requestAnimationFrame(resolve));
        return {rounds,rapidFinal:sample()};
      });
      for (const round of result.rounds) {
        assert(round.maxSizeChange < 0.1, `image resizes after click: ${JSON.stringify(test)} / ${round.n}`);
        assert(round.maxPositionChange < 0.1, `image jumps after click: ${JSON.stringify(test)} / ${round.n}`);
        if (round.last.zoom === 'false') {
          assert.equal(round.last.scrollWidth, round.last.clientWidth);
          assert.equal(round.last.scrollHeight, round.last.clientHeight);
          assert.equal(round.last.scrollLeft, 0); assert.equal(round.last.scrollTop, 0);
        }
        assert.deepEqual(round.first.button, round.last.button, 'controls move during zoom');
      }
      assert.equal(result.rapidFinal.zoom, 'false');
      const zoomed = result.rounds.find(r => r.last.zoom === 'true').last;
      if (test.mode === 'classic') assert(zoomed.stage.width > zoomed.clientWidth, 'classic scrollbar condition not reproduced');
      if (test.width === 1280) assert.equal(zoomed.scrollWidth, zoomed.clientWidth, 'unnecessary horizontal scrollbar');
      await page.locator('.viewer-side[data-side="back"]').click();
      await page.waitForFunction(() => document.querySelector('.viewer-image').src.includes('back-1600.webp') && !document.querySelector('.viewer-image').hidden);
      await page.locator('.viewer-zoom').click();
      await page.setViewportSize({width:test.width,height:test.height-60});
      await page.waitForTimeout(120);
      await page.locator('.viewer-zoom').click();
      assert.equal(await page.locator('.viewer-stage').evaluate(s => s.scrollHeight-s.clientHeight), 0);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('.flyer-viewer').open && !document.body.classList.contains('flyer-viewer-open'));
      assert(await trigger.evaluate(link => link === document.activeElement));
      assert(await page.evaluate(() => Math.abs(scrollY-Number(document.body.dataset.testScroll)) < 2));
      report.rows.push({...test, toggles:72,
        maxSizeChange:Math.max(...result.rounds.map(r => r.maxSizeChange)),
        maxPositionChange:Math.max(...result.rounds.map(r => r.maxPositionChange)),
        zoomed, fitted:result.rapidFinal, pannedImageAndButtonClicks:true,
        rapidToggles:40, switchResizeAndClose:true});
      await context.close();
    }
    assert.deepEqual(report.errors, []);
    fs.writeFileSync(process.env.VIEWER_QA_OUTPUT || path.join(site,'docs/viewer-repeat-results.json'), JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({browser:report.browser,cases:report.rows.map(({mode,width,height}) => ({mode,width,height})),toggles:report.rows.length*72,errors:report.errors}));
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
