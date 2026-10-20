const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'assets/js/gallery.js'), 'utf8');
let cases = 0;
function fixture(count, supported = true) {
  const items = Array.from({ length: count }, (_, i) => `<a href="photo-${i + 1}.jpg" data-gallery-item data-gallery-caption="写真 ${i + 1}"><img alt="写真 ${i + 1}"></a>`).join('');
  const dom = new JSDOM(`<body style="color: blue"><main data-photo-gallery><h1>テスト</h1>${items}<button data-gallery-open hidden>写真を拡大する</button></main></body>`, { url: 'https://example.test/talent/', runScripts: 'outside-only' });
  const w = dom.window;
  let scroll;
  Object.defineProperty(w, 'scrollY', { value: 280 });
  w.scrollTo = value => { scroll = value; };
  if (supported) {
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  }
  w.eval(code);
  return { dom, w, d: w.document, scroll: () => scroll };
}
{
  const f = fixture(1), d = f.d;
  const link = d.querySelector('[data-gallery-item]');
  link.focus(); link.click();
  const viewer = d.querySelector('dialog');
  assert(viewer.open);
  assert.equal(d.activeElement, viewer.querySelector('.photo-viewer-close'));
  assert(viewer.querySelector('.photo-viewer-next').hidden);
  assert(viewer.querySelector('.photo-viewer-counter').hidden);
  assert.equal(d.body.style.top, '-280px');
  assert.equal(f.w.location.pathname, '/talent/');
  viewer.querySelector('img').dispatchEvent(new f.w.Event('error'));
  assert(!viewer.querySelector('.photo-viewer-error').hidden);
  viewer.querySelector('img').dispatchEvent(new f.w.Event('load'));
  assert(viewer.querySelector('.photo-viewer-error').hidden);
  viewer.querySelector('.photo-viewer-close').click();
  assert(!viewer.open);
  assert.equal(d.body.getAttribute('style'), 'color: blue');
  assert.equal(d.activeElement, link);
  assert.equal(f.scroll().top, 280);
  viewer.querySelector('img').dispatchEvent(new f.w.Event('error'));
  assert(viewer.querySelector('.photo-viewer-error').hidden, 'Closed gallery must ignore late image errors');
  cases++; f.dom.window.close();
}
{
  const f = fixture(3), d = f.d, viewer = d.querySelector('dialog');
  d.querySelectorAll('[data-gallery-item]')[1].click();
  const counter = viewer.querySelector('.photo-viewer-counter');
  assert.equal(counter.textContent, '2 / 3');
  assert(!counter.hidden);
  viewer.querySelector('.photo-viewer-next').click();
  assert.equal(counter.textContent, '3 / 3');
  assert(viewer.querySelector('img').src.endsWith('photo-3.jpg'));
  viewer.dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(counter.textContent, '1 / 3');
  viewer.querySelector('.photo-viewer-prev').click();
  assert.equal(counter.textContent, '3 / 3');
  const stage = viewer.querySelector('.photo-viewer-stage');
  function touch(type, touches, changedTouches = []) {
    const e = new f.w.Event(type);
    Object.defineProperties(e, { touches: { value: touches }, changedTouches: { value: changedTouches } });
    stage.dispatchEvent(e);
  }
  touch('touchstart', [{ clientX: 200, clientY: 200 }]);
  touch('touchend', [], [{ clientX: 100, clientY: 205 }]);
  assert.equal(counter.textContent, '1 / 3');
  touch('touchstart', [{ clientX: 200, clientY: 200 }]);
  touch('touchend', [], [{ clientX: 190, clientY: 100 }]);
  assert.equal(counter.textContent, '1 / 3', 'vertical gesture must not switch photos');
  viewer.close(); // Native Escape uses the same close event.
  d.querySelector('[data-gallery-open]').click();
  assert.equal(counter.textContent, '1 / 3');
  assert.equal(d.querySelector('[data-gallery-open]').textContent, '写真を見る（3枚）');
  viewer.close();
  assert.equal(d.activeElement, d.querySelector('[data-gallery-open]'));
  cases++; f.dom.window.close();
}
{
  const f = fixture(1, false);
  assert(!f.d.querySelector('dialog'));
  assert(f.d.querySelector('[data-gallery-open]').hidden);
  assert.equal(f.d.querySelector('[data-gallery-item]').getAttribute('href'), 'photo-1.jpg');
  cases++; f.dom.window.close();
}
{
  const f = fixture(2), d = f.d;
  const item = d.querySelector('[data-gallery-item]');
  item.innerHTML = '<picture><source type="image/webp" srcset="photo-320.webp 320w, photo-960.webp 960w"><img alt="写真"></picture>';
  item.click();
  const viewer = d.querySelector('dialog');
  assert.equal(viewer.querySelector('source').srcset, 'photo-320.webp 320w, photo-960.webp 960w');
  assert(viewer.querySelector('img').src.endsWith('photo-1.jpg'), 'JPEG fallback remains usable');
  viewer.querySelector('.photo-viewer-next').click();
  assert(!viewer.querySelector('source').hasAttribute('srcset'), 'A JPEG-only item must not reuse the previous photo');
  viewer.close();
  assert(!viewer.querySelector('source').hasAttribute('srcset'), 'Closing releases responsive sources');
  cases++; f.dom.window.close();
}
console.log(JSON.stringify({ galleryCases: cases, singlePhoto: true, multiplePhotos: true, fallback: true }));
