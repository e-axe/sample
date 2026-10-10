// Run with Playwright installed; use the same runtime/output variables as
// check_flyer_viewer.cjs. VIEWER_QA_URL selects a deployed preview instead.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const site = path.resolve(__dirname, '..');

(async () => {
  let server;
  let url = process.env.VIEWER_QA_URL;
  const remote = Boolean(url);
  if (!remote) {
    server = http.createServer((req, res) => {
      let file = path.join(path.dirname(site), decodeURIComponent(req.url.split('?')[0]));
      if (file.endsWith('/')) file += 'index.html';
      try {
        res.setHeader('Content-Type', {'.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'application/javascript', '.webp':'image/webp', '.woff2':'font/woff2', '.svg':'image/svg+xml'}[path.extname(file)] || 'application/octet-stream');
        res.end(fs.readFileSync(file));
      } catch { res.statusCode = 404; res.end('not found'); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${server.address().port}/${path.basename(site)}/`;
  }
  let proxy;
  if (remote && (process.env.HTTPS_PROXY || process.env.HTTP_PROXY)) {
    const p = new URL(process.env.HTTPS_PROXY || process.env.HTTP_PROXY);
    proxy = {server:p.protocol+'//'+p.host,username:decodeURIComponent(p.username),password:decodeURIComponent(p.password)};
  }
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined, headless:true, proxy,
    ignoreDefaultArgs:['--hide-scrollbars'],
    args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--disable-features=OverlayScrollbar,OverlayScrollbars,FluentOverlayScrollbar']
  });
  const report = {browser:browser.version(), sourceCommit:process.env.SOURCE_COMMIT || null,
    environment:remote?'public preview':'local HTTP subdirectory', deviceScaleFactor:1,
    browserTlsVerification:remote?'managed proxy CA exception; separate byte verification uses normal TLS':'local HTTP', rows:[],errors:[]};
  const cases = remote ? [
    {mode:'classic',width:1440,height:900,touch:false}, {mode:'hidden',width:390,height:844,touch:true}
  ] : [
    {mode:'classic',width:1440,height:900,touch:false}, {mode:'hidden',width:1440,height:900,touch:false},
    {mode:'classic',width:1280,height:600,touch:false}, {mode:'hidden',width:1920,height:1080,touch:false},
    {mode:'hidden',width:390,height:844,touch:true}, {mode:'hidden',width:844,height:390,touch:true}
  ];
  try {
    for (const test of cases) {
      const context = await browser.newContext({viewport:{width:test.width,height:test.height},
        hasTouch:test.touch,isMobile:test.touch,deviceScaleFactor:1,ignoreHTTPSErrors:remote});
      const page = await context.newPage();
      let popups = 0;
      page.on('popup', () => popups++);
      page.on('pageerror', error => report.errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`); });
      await page.goto(url, {waitUntil:'networkidle'});
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('.cast-card').count(),18);
      assert.equal(await page.locator('[data-show-number]').count(),7);
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow,noarchive');
      assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').filter(r => r.name.includes('flyer-')).length),0);
      if (test.mode === 'hidden') await page.addStyleTag({content:'.viewer-stage{scrollbar-width:none}.viewer-stage::-webkit-scrollbar{display:none}'});
      const trigger = page.locator('.flyer-image-link').first();
      const stage = page.locator('.viewer-stage');
      const zoom = page.locator('.viewer-zoom');
      const loaded = () => page.waitForFunction(() => !document.querySelector('.viewer-image').hidden && !document.querySelector('.viewer-zoom').disabled);
      const sample = () => stage.evaluate(s => ({left:s.scrollLeft,top:s.scrollTop,
        maxLeft:s.scrollWidth-s.clientWidth,maxTop:s.scrollHeight-s.clientHeight,
        dragging:s.classList.contains('is-dragging'),cursor:getComputedStyle(s.querySelector('img')).cursor,
        zoom:document.querySelector('.viewer-zoom').getAttribute('aria-pressed')}));
      const center = () => stage.evaluate(s => { const r=s.getBoundingClientRect();return {x:r.x+s.clientWidth/2,y:r.y+s.clientHeight/2}; });
      await trigger.evaluate(link => link.addEventListener('pointerdown', () => { document.body.dataset.testScroll = String(scrollY); }, {once:true}));
      if (test.touch) await trigger.tap(); else await trigger.click();
      await loaded(); await page.waitForTimeout(220);
      if (test.touch) await zoom.tap(); else await zoom.click();
      const row = {...test,checks:[]};
      const initial = await sample();
      assert.equal(initial.zoom,'true');
      assert.equal(initial.cursor,test.touch?'zoom-out':'grab');
      assert(await page.locator(test.touch?'.viewer-touch-help':'.viewer-mouse-help').isVisible());
      assert(!(await page.locator(test.touch?'.viewer-mouse-help':'.viewer-touch-help').isVisible()));
      assert.equal(await page.locator('.viewer-image').getAttribute('draggable'),'false');
      if (process.env.VIEWER_QA_SCREENSHOTS) await page.screenshot({path:path.join(process.env.VIEWER_QA_SCREENSHOTS,`viewer-drag-${test.width}-${test.mode}.png`)});
      if (test.touch) {
        // Real browser touch input, not synthetic JS scrolling.
        const cdp = await context.newCDPSession(page);
        const start = await center();
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start.x,y:start.y}]});
        for (let n=1;n<=12;n++) {
          await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x,y:start.y-n*10}]});
          await page.waitForTimeout(18);
        }
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await page.waitForTimeout(350);
        const after = await sample();
        assert(after.top > initial.top+50,'native touch scrolling was blocked');
        assert.equal(after.zoom,'true'); assert.equal(after.dragging,false);
        row.touchScroll={before:initial.top,after:after.top};
        row.checks.push('native touch swipe; no mouse capture or unintended zoom');
        await zoom.tap();
      } else {
        const dragBy = async (dx,dy) => {
          const start=await center(),before=await sample();
          await page.mouse.move(start.x,start.y); await page.mouse.down();
          await page.mouse.move(start.x+dx,start.y+dy,{steps:8});
          const during=await sample();
          assert.equal(during.dragging,true); assert.equal(during.cursor,'grabbing');
          assert(Math.abs(during.left-Math.max(0,Math.min(before.maxLeft,before.left-dx)))<1);
          assert(Math.abs(during.top-Math.max(0,Math.min(before.maxTop,before.top-dy)))<1);
          await page.mouse.up();
          const after=await sample();
          assert.equal(after.zoom,'true','drag release zoomed the image out');
          assert.equal(after.dragging,false); assert.equal(after.cursor,'grab');
          return {dx,dy,before:{left:before.left,top:before.top},after:{left:after.left,top:after.top}};
        };
        row.drags=[await dragBy(110,70),await dragBy(-100,-85)];
        row.checks.push('bidirectional mouse drag; clamped scroll position; grab/grabbing; release keeps zoom');
        // Capture keeps movement and release reliable beyond the dialog.
        const start=await center();
        await page.mouse.move(start.x,start.y);await page.mouse.down();
        await page.mouse.move(2,2,{steps:8});await page.mouse.up();
        assert.equal((await sample()).zoom,'true');assert.equal((await sample()).dragging,false);
        assert.equal(await page.locator('.flyer-viewer').evaluate(v=>v.open),true);
        row.checks.push('drag outside dialog and release; dialog stays open');
        // Genuine image clicks and sub-threshold movement still toggle zoom.
        for (const jitter of [0,2]) {
          const point=await center();await page.mouse.move(point.x,point.y);await page.mouse.down();
          if (jitter) await page.mouse.move(point.x+jitter,point.y+jitter);
          await page.mouse.up();assert.equal((await sample()).zoom,'false');await zoom.click();
        }
        row.checks.push('intentional click after drag; 2px click jitter');
        const wheelBefore=await sample(),point=await center();
        await page.mouse.move(point.x,point.y);await page.mouse.wheel(0,120);await page.waitForTimeout(150);
        assert((await sample()).top>wheelBefore.top+50);assert.equal((await sample()).zoom,'true');
        row.checks.push('native wheel scrolling');
        if (test.mode === 'classic') {
          const track = await stage.evaluate(s=>{
            s.scrollTop=0;
            const r=s.getBoundingClientRect();
            return {x:r.x+s.clientWidth+(r.width-s.clientWidth)/2,y:r.y+s.clientHeight-20};
          });
          await page.mouse.click(track.x,track.y);
          await page.waitForTimeout(200);
          assert((await sample()).top>0,'native scrollbar track was blocked');
          assert.equal((await sample()).dragging,false);assert.equal((await sample()).zoom,'true');
          row.checks.push('native classic scrollbar track');
        }
        await page.mouse.move(point.x,point.y);
        await stage.evaluate(s=>s.addEventListener('pointerdown',e=>window.__testPointerId=e.pointerId,{once:true}));
        await page.mouse.down();await page.mouse.move(point.x-40,point.y-40,{steps:4});
        await stage.evaluate(s=>s.dispatchEvent(new PointerEvent('pointercancel',{pointerId:window.__testPointerId,bubbles:true})));
        assert.equal((await sample()).dragging,false);await page.mouse.up();
        // Browser interruption handling is checked by dispatching the blur event.
        await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x-30,point.y-30,{steps:4});
        await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
        assert.equal((await sample()).dragging,false);await page.mouse.up();
        row.checks.push('pointercancel/blur handler cleanup (dispatched events)');
        await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x-30,point.y-30,{steps:4});
        await page.keyboard.press('Escape');await page.mouse.up();
        await page.waitForFunction(()=>!document.querySelector('.flyer-viewer').open&&!document.body.classList.contains('flyer-viewer-open'));
        assert.equal((await sample()).dragging,false);
        assert(await trigger.evaluate(link=>link===document.activeElement));
        await trigger.click();await loaded();await zoom.click();
        row.drags.push(await dragBy(30,30));
        row.checks.push('Escape during drag; capture reset and reopening');
        await zoom.click();
      }
      assert.equal((await sample()).zoom,'false');
      assert.equal(await stage.evaluate(s=>s.scrollHeight-s.clientHeight),0);
      assert.equal(await stage.evaluate(s=>s.scrollWidth-s.clientWidth),0);
      const side=page.locator('.viewer-side[data-side="back"]');
      if (test.touch) await side.tap(); else await side.click();
      await loaded();assert((await page.locator('.viewer-image').getAttribute('src')).includes('back-1600.webp'));
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>!document.querySelector('.flyer-viewer').open&&!document.body.classList.contains('flyer-viewer-open'));
      assert(await trigger.evaluate(link=>link===document.activeElement));
      assert(await page.evaluate(()=>Math.abs(scrollY-Number(document.body.dataset.testScroll))<2));
      assert.equal(page.url(),url);assert.equal(popups,0);
      row.checks.push('fit resets overflow; front/back; Escape; scroll and focus restoration; same page');
      report.rows.push(row);await context.close();
    }
    assert.deepEqual(report.errors,[]);
    fs.writeFileSync(process.env.VIEWER_QA_OUTPUT || path.join(site,'docs/viewer-drag-results.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({browser:report.browser,cases:report.rows.map(({width,height,mode,touch})=>({width,height,mode,touch})),errors:report.errors}));
  } finally { await browser.close();server?.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
