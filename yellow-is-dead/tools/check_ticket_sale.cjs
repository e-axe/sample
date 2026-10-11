const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.SALE_QA_OUTPUT || path.join(root, 'docs/sale-automation-20261011-results.json');
const screenshots = process.env.SALE_QA_SCREENSHOTS;

(async () => {
  const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
  const sale = JSON.parse(await fs.readFile(path.join(root, 'performance.json'), 'utf8')).sale;
  const start = Date.parse(sale.startsAt), end = Date.parse(sale.endsAt);
  const browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? {executablePath: process.env.CHROMIUM_EXECUTABLE} : {})});
  const results = [];
  const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
  async function open(time, options = {}) {
    const context = await browser.newContext({viewport:{width:options.width || 390,height:900}, timezoneId:options.timezone || 'Asia/Tokyo', javaScriptEnabled:options.javascript !== false});
    const errors = [];
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'yellow.test') return route.abort();
      let rel = decodeURIComponent(url.pathname).replace(/^\/client\/yellow\//, '/').replace(/^\//, '') || 'index.html';
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.resolve(root, rel);
      if (!file.startsWith(root + path.sep)) return route.fulfill({status:403, body:''});
      try {
        let body = await fs.readFile(file);
        if (rel === 'index.html' && options.override) {
          const data = JSON.stringify({...sale, ...options.override}).replace(/</g, '\\u003c');
          body = Buffer.from(body.toString().replace(/(<script type="application\/json" id="ticket-sale-config">)[\s\S]*?(<\/script>)/, (_, a, b) => a + data + b));
        }
        await route.fulfill({status:200,body,contentType:mime[path.extname(file)] || 'application/octet-stream'});
      } catch { errors.push('missing ' + rel); await route.fulfill({status:404,body:''}); }
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(String(error)));
    if (options.javascript !== false) {
      await page.clock.install({time:new Date(time - 10000)});
      await page.clock.pauseAt(new Date(time));
    }
    await page.goto(`${options.protocol || 'http'}://yellow.test/${options.subdirectory ? 'client/yellow/' : ''}`);
    return {context,page,errors};
  }
  async function check(page, expected, purchase = expected === 'on_sale') {
    assert.equal(await page.locator('.sale-status').textContent(), expected === 'ended' ? '販売終了' : purchase ? '販売中' : expected === 'before_sale' ? '発売前' : 'チケット情報');
    const links = await page.locator('[data-ticket-placement]').evaluateAll(elements => elements.map(e => ({place:e.dataset.ticketPlacement,label:e.querySelector('.ticket-cta-label').textContent,href:e.getAttribute('href'),target:e.target,rel:e.rel,hidden:e.hidden,hintHidden:e.querySelector('.ticket-new-tab-hint').hidden})));
    assert.equal(links.length, 5);
    for (const link of links) {
      if (purchase) {
        assert.equal(link.label, 'チケットを購入');
        assert.equal(link.href, sale.url);
        assert.equal(link.target, '_blank');
        assert.ok(link.rel.includes('noopener') && link.rel.includes('noreferrer'));
        assert.equal(link.hintHidden, false);
      } else if (link.place !== 'ticket' || expected === 'ended') {
        assert.equal(link.href, '#ticket');
        assert.equal(link.target, '');
        assert.equal(link.hintHidden, true);
        if (expected === 'ended') assert.equal(link.label, '公演情報');
      }
    }
    if (expected === 'ended') assert.equal(await page.locator('.sale-page-link').isVisible(), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('.cast-card').count(), 18);
    assert.equal(await page.locator('[data-show-number]').count(), 7);
    return links;
  }
  try {
    for (const [name,time,state] of [['start-minus-1ms',start-1,'before_sale'],['exact-start',start,'on_sale'],['late-install',start+86400000,'on_sale'],['end-minus-1ms',end-1,'on_sale'],['exact-end',end,'ended'],['after-end',end+86400000,'ended']]) {
      const test = await open(time, {timezone:'America/Los_Angeles'});
      const links = await check(test.page, state);
      assert.deepEqual(test.errors, []);
      results.push({name,state,links,errors:test.errors});
      await test.context.close();
    }
    for (const [name,time,state] of [['open-across-start',start-1,'on_sale'],['open-across-end',end-1,'ended']]) {
      const test = await open(time);
      await test.page.clock.runFor(1);
      await check(test.page, state);
      assert.deepEqual(test.errors, []);
      results.push({name,state});
      await test.context.close();
    }
    for (const event of ['pageshow','focus','visibilitychange']) {
      const test = await open(start-1000);
      await test.page.clock.setSystemTime(new Date(start));
      await test.page.evaluate(event => (event === 'visibilitychange' ? document : window).dispatchEvent(new Event(event)), event);
      await check(test.page, 'on_sale');
      results.push({name:'resume-'+event,state:'on_sale'});
      await test.context.close();
    }
    const click = await open(start-1000);
    await click.page.clock.setSystemTime(new Date(start));
    await click.page.evaluate(() => document.addEventListener('click', e => { if (e.target.closest('[data-ticket-placement]')) e.preventDefault(); }));
    await click.page.locator('[data-ticket-placement="hero"]').click();
    await check(click.page, 'on_sale');
    results.push({name:'stale-cta-click',state:'on_sale'});
    await click.context.close();
    for (const [name,override,state,purchase] of [['missing-url',{url:''},'information',false],['invalid-url',{url:'javascript:alert(1)'},'information',false],['invalid-period',{startsAt:'invalid'},'information',false],['manual-before',{status:'before_sale'},'before_sale',false],['manual-ended',{status:'ended'},'ended',false],['manual-active',{status:'on_sale'},'on_sale',true]]) {
      const test = await open(start, {override});
      await check(test.page, state, purchase);
      assert.deepEqual(test.errors, []);
      results.push({name,state});
      await test.context.close();
    }
    for (const width of [320,375,390,430,768,1024,1080,1440]) {
      for (const [state,time] of [['before_sale',start-1000],['on_sale',start],['ended',end]]) {
        const test = await open(time, {width,subdirectory:true,protocol:width===1440?'https':'http'});
        await check(test.page, state);
        assert.deepEqual(test.errors, []);
        if (width===390 && state==='on_sale') {
          await test.page.locator('.mobile-menu summary').click();
          assert.equal(await test.page.locator('.mobile-menu').getAttribute('open'), '');
          await test.page.keyboard.press('Escape');
          assert.equal(await test.page.locator('.mobile-menu').getAttribute('open'), null);
          await test.page.locator('.flyer-image-link').first().click();
          assert.equal(await test.page.locator('.flyer-viewer').getAttribute('open'), '');
          await test.page.keyboard.press('Escape');
          assert.equal(await test.page.locator('.flyer-viewer').getAttribute('open'), null);
        }
        if (screenshots && [390,1440].includes(width)) {
          await fs.mkdir(screenshots,{recursive:true});
          await test.page.screenshot({path:path.join(screenshots,`${width}-${state}.png`)});
          await test.page.locator('.ticket-section').screenshot({path:path.join(screenshots,`${width}-${state}-ticket.png`)});
        }
        results.push({name:'layout',width,state,protocol:width===1440?'https':'http',subdirectory:true});
        await test.context.close();
      }
    }
    const disabled = await open(start, {javascript:false});
    assert.equal(await disabled.page.locator('.cast-card').count(),18);
    assert.equal(await disabled.page.locator('.sale-page-link').getAttribute('href'),sale.url);
    assert.equal(await disabled.page.locator('.sale-status').textContent(),sale.releaseText);
    results.push({name:'javascript-disabled',fallback:'neutral release information and sales-page link'});
    await disabled.context.close();
    const report = {date:'2026-10-11',browser:await browser.version(),environment:'Windows Chrome headless; HTTP/HTTPS requests fulfilled by Playwright from verified local files; no client-server/TLS or physical mobile tests',sale,results,passed:results.length};
    await fs.mkdir(path.dirname(output),{recursive:true});
    await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({passed:results.length,output,browser:report.browser}));
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
