const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const seo = require('./seo.cjs');
const { build } = require('./build-production.cjs');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const originals = new Map(seo.pages.map(file => [file, sha(seo.read(file))]));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'saimer-seo-'));
const output = path.join(temp, 'public_html');
let checks = 0;
function validate(file, html, base, production) {
  const dom = new JSDOM(html);
  const d = dom.window.document;
  assert.equal(d.documentElement.lang, 'ja');
  assert.equal(d.querySelectorAll('title').length, 1, file);
  assert.equal(d.querySelectorAll('h1').length, 1, file);
  assert(d.title.includes(seo.config.reading));
  assert(d.body.textContent.includes(seo.config.reading));
  assert(html.indexOf('charset="utf-8"') < 1024);
  const ids = [...d.querySelectorAll('[id]')].map(n => n.id);
  assert.equal(ids.length, new Set(ids).size, file);
  for (const attr of ['name', 'property']) {
    const names = [...d.querySelectorAll(`meta[${attr}]`)].map(n => n.getAttribute(attr));
    assert.equal(names.length, new Set(names).size, file + ' duplicate metadata');
  }
  const meta = (name, attr = 'name') => d.querySelector(`meta[${attr}="${name}"]`)?.content;
  assert.equal(d.querySelectorAll('link[rel="canonical"]').length, 1);
  assert.equal(d.querySelector('link[rel="canonical"]').href, seo.urlFor(file, base));
  assert(meta('description').includes(seo.config.reading));
  assert.equal(meta('og:title', 'property'), d.title);
  assert.equal(meta('og:description', 'property'), meta('description'));
  assert.equal(meta('og:url', 'property'), seo.urlFor(file, base));
  assert.equal(meta('og:locale', 'property'), 'ja_JP');
  assert.equal(meta('og:site_name', 'property'), seo.config.name);
  assert.equal(meta('og:image', 'property'), new URL(seo.config.ogImage, base).href);
  assert.equal(meta('og:image:type', 'property'), 'image/jpeg');
  assert.equal(meta('og:image:width', 'property'), '1200');
  assert.equal(meta('og:image:height', 'property'), '630');
  assert(meta('og:image:alt', 'property'));
  assert.equal(meta('twitter:card'), 'summary_large_image');
  assert.equal(meta('twitter:image'), meta('og:image', 'property'));
  assert.equal(meta('twitter:title'), d.title);
  assert.equal(meta('twitter:description'), meta('description'));
  assert.equal(meta('robots').includes('noindex'), !production);
  assert.equal(meta('robots').includes('nofollow'), !production);
  if (production) {
    assert.equal(d.querySelectorAll('.sample-tag,.sample-bar').length, 0);
    assert(!/SAMPLE SITE|e-axe\.github\.io|最終確認用サイト|noindex|nofollow/.test(html));
  }
  const ld = JSON.parse(d.querySelector('#seo-structured-data').textContent);
  assert.equal(ld['@context'], 'https://schema.org');
  const graph = ld['@graph'];
  assert.equal(new Set(graph.map(n => n['@id'])).size, graph.length);
  const org = graph.find(n => n['@type'] === 'Organization');
  assert.equal(org.legalName, seo.config.legalName);
  assert(org.alternateName.includes(seo.config.reading));
  assert.equal(org.url, base);
  assert.equal(org.address.postalCode, '160-0023');
  assert.equal(org.identifier.value, '8011103014507');
  assert(!org.email, 'Pending mailbox must not become an active structured contact');
  const web = graph.find(n => /^(WebPage|ProfilePage|CollectionPage|AboutPage|ContactPage)$/.test(n['@type']));
  assert.equal(web.url, seo.urlFor(file, base));
  const person = graph.find(n => n['@type'] === 'Person');
  if (file.startsWith('talents/') && file !== 'talents/index.html') {
    assert(person);
    assert.equal(web['@type'], 'ProfilePage');
    assert.equal(person.name, d.querySelector('h1').textContent.trim());
    assert.equal(person.alternateName[0], d.querySelector('.talent-name-kana').textContent.trim());
    assert.equal(person.birthDate, d.querySelector('time').getAttribute('datetime'));
    assert.equal(person.affiliation['@id'], org['@id']);
    assert.equal(web.mainEntity['@id'], person['@id']);
    assert.equal(person.image[0], new URL(d.querySelector('[data-gallery-item]').getAttribute('href'), seo.urlFor(file, base)).href);
    const actualSocials = [...d.querySelectorAll('.talent-social a[data-social-status="active"]')].map(n => n.getAttribute('href'));
    assert.deepEqual(person.sameAs || [], actualSocials);
  }
  if (file !== 'index.html') {
    const crumbs = graph.find(n => n['@type'] === 'BreadcrumbList').itemListElement;
    assert.equal(crumbs[crumbs.length - 1].item, seo.urlFor(file, base));
    crumbs.forEach((crumb, index) => assert.equal(crumb.position, index + 1));
  }
  checks++; dom.window.close();
}
try {
  for (const file of seo.pages) {
    const html = seo.read(file);
    validate(file, html, seo.config.previewBaseUrl, false);
    assert.equal(seo.render(file, html), html, 'Preview generation must be repeatable');
  }
  const result = build(output);
  for (const file of seo.pages) validate(file, fs.readFileSync(path.join(output, file), 'utf8'), seo.config.productionBaseUrl, true);
  const sitemap = new JSDOM(fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8'), { contentType: 'text/xml' });
  const urls = [...sitemap.window.document.querySelectorAll('url > loc')].map(n => n.textContent);
  assert.deepEqual(urls, seo.pages.map(file => seo.urlFor(file, seo.config.productionBaseUrl)));
  assert.equal(sitemap.window.document.getElementsByTagNameNS('http://www.google.com/schemas/sitemap-image/1.1', 'loc').length, 4);
  sitemap.window.close();
  assert(!seo.read('sitemap.xml').includes('<loc>'));
  const robots = fs.readFileSync(path.join(output, 'robots.txt'), 'utf8');
  assert(robots.includes('User-agent: OAI-SearchBot\nAllow: /'));
  assert(robots.includes('Sitemap: https://saimer-pro.com/sitemap.xml'));
  assert(!robots.includes('Disallow: /'));
  assert(!result.manifest.some(n => /(?:sample-portraits|sky-arch|^docs\/|^tools\/|^node_modules\/|originals|site.config|package.json)/.test(n.path)));
  for (const item of result.manifest) {
    if (item.path.startsWith('assets/')) assert.equal(sha(fs.readFileSync(path.join(output, item.path))), sha(fs.readFileSync(path.join(seo.root, item.path))));
  }
  for (const file of seo.pages) {
    const dom = new JSDOM(fs.readFileSync(path.join(output, file), 'utf8'));
    for (const node of dom.window.document.querySelectorAll('[href],[src],[srcset]')) for (const attr of ['href', 'src', 'srcset']) {
      const value = node.getAttribute(attr);
      if (!value) continue;
      for (const ref of attr === 'srcset' ? value.split(',').map(v => v.trim().split(/\s/)[0]) : [value]) {
        const url = new URL(ref, seo.urlFor(file, seo.config.productionBaseUrl));
        if (url.origin !== new URL(seo.config.productionBaseUrl).origin) continue;
        let rel = decodeURIComponent(url.pathname.slice(1));
        if (!rel || rel.endsWith('/')) rel += 'index.html';
        assert(fs.existsSync(path.join(output, rel)), file + ' missing production asset: ' + rel);
      }
    }
    dom.window.close();
  }
  assert.throws(() => build(output), /既存ファイル/);
  assert.throws(() => build(seo.root), /ソース/);
  assert.throws(() => build(path.join(seo.root, 'assets/test-output')), /ソース/);
  assert.throws(() => seo.baseUrl('https://e-axe.github.io/', true));
  assert.throws(() => seo.baseUrl('http://saimer-pro.com/', true));
  assert.throws(() => seo.baseUrl('https://saimer-pro.com/?x=1', true));
  for (const [file, before] of originals) assert.equal(sha(seo.read(file)), before, 'Production build changed preview: ' + file);
  // Read the JPEG frame header instead of assuming the metadata dimensions.
  const jpg = fs.readFileSync(path.join(seo.root, seo.config.ogImage));
  let dimensions;
  for (let offset = 2; offset + 9 < jpg.length;) {
    assert.equal(jpg[offset], 0xff);
    const marker = jpg[offset + 1]; offset += 2;
    const length = jpg.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) { dimensions = [jpg.readUInt16BE(offset + 5), jpg.readUInt16BE(offset + 3)]; break; }
    offset += length;
  }
  assert.deepEqual(dimensions, [1200, 630]);
  const record = { metadataPages: checks, previewNoindex: 9, productionIndexable: 9, productionFiles: result.files, ogImage: { width: 1200, height: 630, bytes: jpg.length }, sourceUnchanged: true, deploymentPerformed: false };
  fs.writeFileSync(path.join(seo.root, 'docs/seo-20261012-check.json'), JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify(record));
} finally {
  // Only remove this test's freshly created temporary directory.
  assert(path.basename(temp).startsWith('saimer-seo-') && path.dirname(temp) === os.tmpdir());
  fs.rmSync(temp, { recursive: true, force: true });
}
