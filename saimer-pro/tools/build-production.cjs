const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const seo = require('./seo.cjs');
const xml = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function privacyWordingHash(html) {
  const dom = new JSDOM(html);
  try {
    const policy = dom.window.document.querySelector('article.policy');
    if (!policy) throw new Error('プライバシー本文が見つかりません。');
    const wording = policy.textContent.replace(/\s+/g, ' ').trim();
    return crypto.createHash('sha256').update(wording).digest('hex');
  } finally { dom.window.close(); }
}
function validateRelease(readiness, contactHtml, privacyHtml) {
  const email = readiness?.email;
  if (email?.status !== 'verified' || !email.verifiedOn || !email.evidence) throw new Error('メールの往復送受信確認が記録されていません。');
  const contact = new JSDOM(contactHtml);
  try {
    const panel = contact.window.document.querySelector('[data-contact-email]');
    const link = contact.window.document.querySelector('[data-mail-link]');
    if (panel?.dataset.contactEmail !== email.address || panel?.dataset.contactReady !== 'true' || link?.getAttribute('href') !== `mailto:${email.address}` || link?.getAttribute('aria-disabled') === 'true') throw new Error('確認済みメールと問い合わせ窓口の設定が一致していません。');
  } finally { contact.window.close(); }
  const privacy = readiness?.privacy;
  if (privacy?.status !== 'approved' || !privacy.approvedOn || !privacy.evidence) throw new Error('プライバシー文面の最終承認が記録されていません。');
  if (privacy.wordingSha256 !== privacyWordingHash(privacyHtml)) throw new Error('プライバシー本文が承認後に変更されています。再確認してください。');
}
function build(output, base = seo.config.productionBaseUrl) {
  base = seo.baseUrl(base, true);
  output = path.resolve(output);
  const dist = path.join(seo.root, 'dist');
  if (output === seo.root || seo.root.startsWith(output + path.sep) || (output.startsWith(seo.root + path.sep) && output !== dist && !output.startsWith(dist + path.sep))) throw new Error('出力先をソースや画像フォルダにしないでください。');
  if (fs.existsSync(output) && fs.readdirSync(output).length) throw new Error('出力先に既存ファイルがあります。新しい空のフォルダを指定してください。');
  validateRelease(seo.config.releaseReadiness, seo.read('contact/index.html'), seo.read('privacy/index.html'));
  const files = new Map();
  const assets = new Set([seo.config.ogImage]);
  function reference(ref, pageUrl) {
    if (!ref || /^(?:mailto:|data:|javascript:)/.test(ref)) return;
    const url = new URL(ref, pageUrl);
    if (url.origin !== new URL(base).origin || !url.pathname.startsWith(new URL(base).pathname)) return;
    let rel = decodeURIComponent(url.pathname.slice(new URL(base).pathname.length));
    if (!rel || rel.endsWith('/')) rel += 'index.html';
    if (seo.pages.includes(rel)) return;
    if (!rel.startsWith('assets/')) throw new Error('公開対象外の参照があります: ' + rel);
    assets.add(rel);
  }
  for (const file of seo.pages) {
    let html = seo.render(file, seo.read(file), { production: true, base });
    if (file === 'contact/index.html' && !html.includes('data-contact-ready="true"')) throw new Error('本番用メール窓口が有効になっていません。');
    html = html.replace(/\s*<span class="sample-tag">SAMPLE SITE<\/span>/g, '')
      .replace(/\s*<div class="sample-bar">[\s\S]*?<\/div>\s*<\/div>/g, '')
      .replace(/\s*<p>SAMPLE SITE \/ NOT FOR PUBLIC RELEASE<\/p>/g, '');
    if (/noindex|nofollow|SAMPLE SITE|最終確認用サイト|e-axe\.github\.io|開設準備中|サンプル文面|policy-notice/.test(html)) throw new Error('確認用設定が残っています: ' + file);
    files.set(file, Buffer.from(html));
    const dom = new JSDOM(html);
    for (const node of dom.window.document.querySelectorAll('[href],[src],[srcset]')) {
      for (const attr of ['href', 'src', 'srcset']) {
        const value = node.getAttribute(attr);
        for (const ref of attr === 'srcset' && value ? value.split(',').map(v => v.trim().split(/\s/)[0]) : [value]) reference(ref, seo.urlFor(file, base));
      }
    }
    dom.window.close();
  }
  for (const asset of assets) {
    const source = path.resolve(seo.root, asset);
    if (!source.startsWith(path.join(seo.root, 'assets') + path.sep) || !fs.lstatSync(source).isFile()) throw new Error('画像・資産の参照を確認してください: ' + asset);
    const data = fs.readFileSync(source);
    files.set(asset, data);
    if (asset.endsWith('.css')) for (const match of data.toString().matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) reference(match[1], new URL(asset, base).href);
  }
  const sitemap = seo.pages.map(file => {
    const info = seo.metadata(file, base);
    const images = info.person?.entity.image.map(image => `<image:image><image:loc>${xml(image)}</image:loc><image:title>${xml(info.person.name)}の宣材写真</image:title></image:image>`).join('') || '';
    return `  <url><loc>${xml(seo.urlFor(file, base))}</loc>${images}</url>`;
  });
  files.set('sitemap.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${sitemap.join('\n')}\n</urlset>\n`));
  files.set('robots.txt', Buffer.from(`User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: ${base}sitemap.xml\n`));
  const www = new URL(base).hostname.replace(/\./g, '\\.');
  const directoryRoutes = seo.pages.filter(file => file !== 'index.html').map(file => file.replace(/\/index\.html$/, '')).join('|');
  files.set('.htaccess', Buffer.from(`DirectoryIndex index.html\n\n<IfModule mod_rewrite.c>\nRewriteEngine On\n# Enable only after SSL for both apex and www is available.\n# Normalize file and directory URLs directly to the final HTTPS host.\nRewriteCond %{THE_REQUEST} \\s/+(.*/)?index\\.html(?:[?\\s]) [NC]\nRewriteRule ^(.*)index\\.html$ ${base}$1 [R=301,L,NE]\n\nRewriteRule ^(${directoryRoutes})$ ${base}$1/ [R=301,L,NE]\n\nRewriteCond %{HTTP_HOST} ^www\\.${www}$ [NC,OR]\nRewriteCond %{HTTPS} !=on\nRewriteRule ^ ${base.slice(0, -1)}%{REQUEST_URI} [R=301,L,NE]\n</IfModule>\n`));
  // Finish validation before writing: incomplete builds never modify the source.
  fs.mkdirSync(output, { recursive: true });
  const manifest = [];
  for (const [file, data] of files) {
    const target = path.join(output, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
    manifest.push({ path: file, bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') });
  }
  return { baseUrl: base, pages: seo.pages.length, files: manifest.length, manifest, output };
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length && (args[0] !== '--out' || args.length !== 2)) throw new Error('使用方法: node tools/build-production.cjs [--out 出力フォルダ]');
  const result = build(args[1] || path.join(seo.root, 'dist/production'));
  console.log(JSON.stringify({ baseUrl: result.baseUrl, pages: result.pages, files: result.files, output: result.output }));
}
module.exports = { build, validateRelease, privacyWordingHash };
