const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const seo = require('./seo.cjs');
const code = seo.read('assets/js/main.js');
let cases = 0;
function fixture(width) {
  const dom = new JSDOM(seo.read('index.html'), { url: seo.config.previewBaseUrl, runScripts: 'outside-only' });
  const w = dom.window;
  w.innerWidth = width;
  w.matchMedia = () => ({ matches: true });
  w.eval(code);
  return dom;
}
{
  const dom = fixture(390), w = dom.window, d = w.document;
  const toggle = d.querySelector('[data-menu-toggle]'), nav = d.querySelector('[data-menu]');
  toggle.focus(); toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert(d.querySelector('main').inert);
  assert.equal(d.activeElement, nav.querySelector('a'));
  const last = [...nav.querySelectorAll('a')].at(-1);
  last.focus(); last.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  assert.equal(d.activeElement, toggle);
  toggle.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
  assert.equal(d.activeElement, last);
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(d.activeElement, toggle);
  assert(!d.querySelector('main').inert);
  cases++;
  toggle.click();
  nav.querySelector('a[href="#social"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(d.activeElement.id, 'social', 'Same-page navigation must focus its destination');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  cases++;
  toggle.click(); toggle.focus();
  w.innerWidth = 1200; w.dispatchEvent(new w.Event('resize'));
  assert.equal(d.activeElement, nav.querySelector('a'), 'Focus must leave a now-hidden mobile toggle');
  assert(!nav.inert);
  cases++;
  w.innerWidth = 390; w.dispatchEvent(new w.Event('resize'));
  assert.equal(d.activeElement, toggle);
  assert(nav.inert);
  toggle.click();
  w.innerWidth = 420; w.dispatchEvent(new w.Event('resize'));
  assert.equal(toggle.getAttribute('aria-expanded'), 'true', 'An in-range resize must preserve the open menu');
  cases++;
  assert.equal(d.querySelector('[data-font-stylesheet]').media, 'all');
  dom.window.close();
}
for (const file of seo.pages) {
  const dom = new JSDOM(seo.read(file)), d = dom.window.document;
  assert.equal(d.querySelector('[data-font-stylesheet]').media, 'print');
  assert(d.querySelector('noscript').innerHTML.includes('fonts.googleapis.com'), 'No-JS font fallback');
  assert(!/^(?:<{7}|={7}|>{7})/m.test(seo.read(file)), 'Conflict markers');
  if (file.split('/').length === 3) {
    for (const n of d.querySelectorAll('.talent-main-photo [sizes]')) {
      assert(n.getAttribute('sizes').startsWith('(max-width: 359px) calc(100vw - 40px)'), file);
    }
  }
  dom.window.close();
}
console.log(JSON.stringify({ menuCases: cases, fontPages: seo.pages.length, narrowPortraitPages: 4 }));
