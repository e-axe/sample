const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const paths = ['index.html','talents/index.html','about/index.html','contact/index.html','privacy/index.html',...['ishihara-yueto','nakayama-yui','tsukigata-hina','takashima-hiroki'].map(s=>`talents/${s}/index.html`)];
const failures = [];
let checkedRefs = 0;
for (const file of paths) {
  const html = fs.readFileSync(path.join(root,file),'utf8');
  const document = new JSDOM(html).window.document;
  assert.equal(document.querySelectorAll('h1').length,1,file);
  assert(document.querySelector('meta[name="robots"]').content.includes('noindex'),file);
  const ids = [...document.querySelectorAll('[id]')].map(n=>n.id);
  assert.equal(ids.length,new Set(ids).size,file+' duplicate IDs');
  assert(!html.includes('20261011-3'),file+' stale cache key');
  assert(!html.includes('sky-arch-'),file+' active arch reference');
  assert(html.includes('contact@saimer-pro.com'),file+' contact address');
  assert.equal(document.querySelectorAll('link[href*="assets/css/design-20261012.css?v=20261019-client1"]').length,1,file);
  for (const n of document.querySelectorAll('[href],[src],[srcset]')) {
    for(const attr of ['href','src','srcset']) {
      const value=n.getAttribute(attr);
      if(!value)continue;
      const candidates=attr==='srcset'?value.split(',').map(v=>v.trim().split(/\s/)[0]):[value];
      for(const ref of candidates) {
        if(/^(?:https?:|mailto:|data:|#)/.test(ref))continue;
        let target=path.resolve(path.dirname(path.join(root,file)),ref.split(/[?#]/)[0]);
        if(!target.startsWith(root+path.sep)&&target!==root)throw Error('Outside site '+ref);
        if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
        checkedRefs++;
        if(!fs.existsSync(target))failures.push(file+' -> '+ref);
      }
    }
  }
  for(const img of document.querySelectorAll('img[src*="images/talents"]'))assert(img.hasAttribute('width')&&img.hasAttribute('height')&&img.getAttribute('alt'),file);
  if(file.split('/').length===3) {
    const slug=file.split('/')[1];
    assert.equal(document.querySelector('.profile-offer'),null);
    assert.equal(document.querySelector('.talent-offer-link').getAttribute('href'),`../../contact/?talent=${slug}`);
    assert.equal(document.querySelectorAll('.talent-contact a[href*="?talent="]').length,1);
    assert.equal(document.querySelectorAll('[data-gallery-item]').length,1);
    assert(!document.querySelector('[data-gallery-item]').hasAttribute('target'));
    assert(document.querySelector('[data-gallery-open]').hidden);
    assert.equal(document.querySelectorAll('script[src*="gallery.js?v=20261015-final1"]').length,1);
  }
}
for(const file of ['style.css','sky-images.css','design-20261012.css','gallery.css']) {
  const css=fs.readFileSync(path.join(root,'assets/css',file),'utf8');
  for(const m of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) {
    if(/^https?:|^data:/.test(m[1]))continue;
    assert(fs.existsSync(path.resolve(root,'assets/css',m[1])),file+' -> '+m[1]);
  }
}
assert.deepEqual(failures,[]);
const aboutDocument=new JSDOM(fs.readFileSync(path.join(root,'about/index.html'),'utf8')).window.document;
assert(aboutDocument.querySelector('.about-opening > .page-hero'));
assert(aboutDocument.querySelector('.about-opening > .philosophy-section'));
const code=fs.readFileSync(path.join(root,'assets/js/main.js'),'utf8');
const original=fs.readFileSync(path.join(root,'contact/index.html'),'utf8');
const names={'ishihara-yueto':'石原 月斗','nakayama-yui':'中山 結心','tsukigata-hina':'月形 陽南','takashima-hiroki':'髙島 大幹'};
const staticContact = new JSDOM(original).window.document;
assert.equal(staticContact.querySelector('[data-contact-email]').dataset.contactReady, 'true');
assert.equal(staticContact.querySelector('[data-mail-link]').getAttribute('href'), 'mailto:contact@saimer-pro.com');
assert(!staticContact.querySelector('[data-mail-link]').hasAttribute('aria-disabled'));
assert(!staticContact.querySelector('[data-copy-email]').disabled);
assert([...staticContact.querySelectorAll('[data-email-pending]')].every(n => n.hidden));
assert(!original.includes('開設準備中'));
let cases=0;
function fixture(ready, query, html=original) {
  const dom=new JSDOM(html,{url:'https://example.test/contact/'+query,runScripts:'outside-only'});
  const w=dom.window;
  w.matchMedia=()=>({matches:true});
  const p=w.document.querySelector('[data-contact-email]');
  p.dataset.contactReady=String(ready);
  w.eval(code);
  return dom;
}
for(const [slug,name] of Object.entries(names))for(const [type,prefix] of [['casting','出演依頼'],['press','取材依頼'],['other','お問い合わせ']]) {
  const dom=fixture(true,`?talent=${slug}&type=${type}`),d=dom.window.document;
  const uri=new URL(d.querySelector('[data-mail-link]').href);
  assert.equal(uri.protocol,'mailto:');
  assert.equal(uri.pathname,'contact@saimer-pro.com');
  assert(uri.searchParams.get('subject').includes(name));
  assert(uri.searchParams.get('subject').includes(prefix));
  assert(uri.searchParams.get('body').includes(name));
  assert.equal(d.querySelector('[data-talent-return-link]').getAttribute('href'),`../talents/${slug}/`);
  cases++;dom.window.close();
}
for(const ready of [false,true]) {
  const dom=fixture(ready,'?talent=ishihara-yueto'),d=dom.window.document;
  assert.equal(d.querySelector('[data-mail-link]').hasAttribute('href'),ready);
  assert.equal(d.querySelector('[data-email-pending]').hidden,ready);
  assert.equal(d.querySelector('[data-email-address]').textContent,'contact@saimer-pro.com');
  d.querySelector('[data-inquiry-talent]').value='nakayama-yui';
  d.querySelector('[data-inquiry-talent]').dispatchEvent(new dom.window.Event('change'));
  assert(d.querySelector('[data-selected-talent]').textContent.includes('中山 結心'));
  assert.equal(new URL(dom.window.location.href).searchParams.get('talent'), 'nakayama-yui');
  assert(!d.querySelector('.contact-purpose-grid'), 'Do not repeat the inquiry selector as static categories');
  assert.equal(d.querySelector('[data-mail-link]').hasAttribute('href'),ready);
  cases++;dom.window.close();
}
for(const query of ['?talent=__proto__&type=__proto__','?talent=missing','?type=missing']) {
  const dom=fixture(false,query);assert.equal(dom.window.document.querySelector('[data-mail-link]').hasAttribute('href'),false);cases++;dom.window.close();
}
const result={pages:paths.length,localReferences:checkedRefs,contactCases:cases,cacheVersion:'20261015-final1',ready:true};
fs.writeFileSync(path.join(root,'docs/release-20261014-site-check.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
