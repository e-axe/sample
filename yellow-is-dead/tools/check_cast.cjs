// CAST delivery verification; originals never enter the public bundle.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const site = path.resolve(process.env.CAST_QA_SITE || path.resolve(__dirname, '..'));
const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../performance.json'), 'utf8'));
const expected = data.castGroups.flatMap(g => g.members.map(p => ({id:p.id, name:p.name})));

(async () => {
 const server = http.createServer((req,res) => {
  let relative = decodeURIComponent(req.url.split('?')[0]).replace(/^\//,'');
  relative = relative.replace(/^yellow-is-dead\//,'');
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const file = path.resolve(site, relative);
  if (!file.startsWith(site + path.sep)) {res.writeHead(403);return res.end();}
  try {res.setHeader('Content-Type', {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.svg':'image/svg+xml'}[path.extname(file)] || 'application/octet-stream');res.end(fs.readFileSync(file));}
  catch {res.writeHead(404);res.end('not found');}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const local = `http://127.0.0.1:${server.address().port}/yellow-is-dead/`;
 const url = process.env.CAST_QA_URL || local;
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true});
 const report = {date:'2026-10-10',url,browser:browser.version(),platform:'Windows; desktop browser with viewport/DPR emulation',rows:[],errors:[],limitations:['Real iOS Safari/Android Chrome not verified','Performance is local synthetic measurement, not real-user INP']};
 const screenshotDir = process.env.CAST_QA_SCREENSHOTS;
 if(screenshotDir) fs.mkdirSync(screenshotDir,{recursive:true});
 try {
  for (const width of process.env.CAST_QA_WIDTHS ? JSON.parse(process.env.CAST_QA_WIDTHS) : [320,359,360,375,390,430,767,768,1024,1079,1080,1240,1440]) {
   const context = await browser.newContext({viewport:{width,height:900},deviceScaleFactor:width<768?2:1});
   const page = await context.newPage();
   const requests=[]; const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400) errors.push(`${r.status()} ${r.url()}`);requests.push(r.url());});
   await page.addInitScript(()=>{window.qaVitals={lcp:0,cls:0};new PerformanceObserver(l=>{for(const e of l.getEntries())window.qaVitals.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.qaVitals.cls+=e.value;}).observe({type:'layout-shift',buffered:true});});
   await page.goto(url,{waitUntil:'networkidle'});
   const initialCastRequests=requests.filter(u=>/yellow-is-dead-cast-/.test(u));
   assert.equal(initialCastRequests.length,0,'CAST portraits must not load at page top');
   for(const card of await page.locator('.cast-card').all()) {
    await card.scrollIntoViewIfNeeded();
    await card.locator('img').evaluate(img=>img.decode());
   }
   await page.evaluate(()=>document.fonts.ready);
   const rows=await page.locator('.cast-card').evaluateAll(cards=>cards.map(c=>{
    const img=c.querySelector('img'), frame=c.querySelector('.cast-photo'), ir=img.getBoundingClientRect(), fr=frame.getBoundingClientRect();
    return {id:c.id,name:c.querySelector('h3').textContent,src:img.currentSrc.split('/').pop(),naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,displayWidth:ir.width,displayHeight:ir.height,frameWidth:fr.width,frameHeight:fr.height,loading:img.loading,alt:img.alt,position:getComputedStyle(img).objectPosition};
   }));
   assert.deepEqual(rows.map(r=>({id:r.id,name:r.name})),expected);
   for(const r of rows) {assert(r.naturalWidth>0);assert(Math.abs(r.displayWidth-r.frameWidth)<2.1);assert(Math.abs(r.displayHeight-r.frameHeight)<2.1);assert.equal(r.loading,'lazy');assert.equal(r.alt,'');assert(r.displayWidth<=Number(r.src.match(/-(\d+)\.(webp|jpg)$/)[1]),'No upscaling at CSS size');}
   const horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   assert.equal(horizontalOverflow,false);
   assert.equal(errors.length,0,errors.join('\n'));
   const metrics=await page.evaluate(()=>({vitals:window.qaVitals,castBytes:performance.getEntriesByType('resource').filter(r=>/yellow-is-dead-cast-/.test(r.name)).reduce((n,r)=>n+r.encodedBodySize,0)}));
   report.rows.push({width,dpr:width<768?2:1,initialCastRequests:initialCastRequests.length,horizontalOverflow,rows,...metrics});
   if(screenshotDir && [390,1440].includes(width)) await page.locator('#cast').screenshot({path:path.join(screenshotDir,`cast-${width}.png`),style:'.site-header,.mobile-sticky,.skip-link{visibility:hidden!important}'});
   await context.close();
  }
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const p=await nojs.newPage();await p.goto(url);await p.locator('#cast').scrollIntoViewIfNeeded();assert.equal(await p.locator('.cast-card').count(),18);report.noJavaScript='18 names and photo frames in initial HTML';await nojs.close();
  const c=await browser.newContext({viewport:{width:390,height:844}});const p2=await c.newPage();
  await p2.route('**/assets/yellow-is-dead-cast-*',r=>r.abort());await p2.goto(url);await p2.locator('#cast-01').scrollIntoViewIfNeeded();
  await p2.locator('#cast-01 .image-fallback').waitFor({state:'visible'});assert.equal(await p2.locator('#cast-01 h3').textContent(),expected[0].name);
  report.imageFailure='Fallback and name retained';await c.close();
  const nav=await browser.newContext({viewport:{width:390,height:844}});const np=await nav.newPage();await np.goto(url);
  await np.locator('.mobile-menu summary').click();await np.locator('#mobile-navigation a[href="#cast"]').click();
  assert.equal(new URL(np.url()).hash,'#cast');assert.equal(await np.locator('.mobile-menu').getAttribute('open'),null);
  await np.locator('#cast-01 img').evaluate(i=>i.decode());
  await np.locator('#cast-01 source').evaluate(s=>s.remove());await np.locator('#cast-01 img').evaluate(i=>i.decode());
  assert((await np.locator('#cast-01 img').evaluate(i=>i.currentSrc)).endsWith('.jpg'));
  report.mobileNavigation='CAST anchor and menu closure pass';report.jpegFallback='JPEG loads when WebP source is removed';await nav.close();
  report.result='pass';
 } catch(e) {report.result='fail';report.errors.push(e.stack);process.exitCode=1;}
 finally {await browser.close();server.close();fs.writeFileSync(process.env.CAST_QA_OUTPUT||path.join(site,'docs/cast-review-20261010.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,widths:report.rows.length,errors:report.errors}));}
})();
