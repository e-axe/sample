const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const config = require('../site.config.json');
const slugs = ['ishihara-yueto', 'nakayama-yui', 'tsukigata-hina', 'takashima-hiroki'];
const pages = ['index.html', 'talents/index.html', ...slugs.map(s => `talents/${s}/index.html`), 'about/index.html', 'contact/index.html', 'privacy/index.html'];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const route = file => file.replace(/index\.html$/, '');
const urlFor = (file, base) => new URL(route(file), base).href;
function baseUrl(value, production = false) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.search || url.hash || url.username || url.password || url.port) throw new Error('HTTPSの正式URLを指定してください。');
  if (production && (url.pathname !== '/' || url.hostname.endsWith('.github.io') || ['localhost', 'example.com', 'example.test'].includes(url.hostname))) throw new Error('本番URLは独自ドメインのルートを指定してください。');
  if (!url.pathname.endsWith('/')) throw new Error('URLは / で終わる形にしてください。');
  return url.href;
}
function person(file, base) {
  const dom = new JSDOM(read(file));
  const d = dom.window.document;
  const name = d.querySelector('h1').textContent.trim();
  const kana = d.querySelector('.talent-name-kana').textContent.trim();
  const english = d.querySelector('.talent-name-en').textContent.trim();
  const job = d.querySelector('.talent-role').textContent.trim().split(' / ')[0];
  const facts = [...d.querySelectorAll('.profile-list > div')];
  const hometown = facts.find(n => n.querySelector('dt').textContent.trim() === '出身地')?.querySelector('dd').textContent.trim();
  const images = [...d.querySelectorAll('[data-gallery-item]')].map(n => new URL(n.getAttribute('href'), urlFor(file, base)).href);
  const description = `${name}（${kana}）の公式プロフィール。${config.name}（${config.reading}）所属の${job}。基本情報・宣材写真${d.querySelector('.credit-item') ? '・出演歴' : ''}と、出演・キャスティングのご相談窓口をご案内します。`;
  const entity = {
    '@type': 'Person', '@id': urlFor(file, base) + '#person', name,
    alternateName: [kana, english], url: urlFor(file, base), description, jobTitle: job,
    affiliation: { '@id': base + '#organization' }, image: images,
    ...(d.querySelector('time[datetime]') ? { birthDate: d.querySelector('time[datetime]').getAttribute('datetime') } : {}),
    ...(hometown ? { birthPlace: { '@type': 'Place', name: hometown } } : {})
  };
  const socials = [...d.querySelectorAll('.talent-social a[data-social-status="active"]')].map(n => n.getAttribute('href'));
  if (socials.length) entity.sameAs = socials;
  dom.window.close();
  return { name, kana, description, entity };
}
function metadata(file, base) {
  const brand = `${config.name}（${config.reading}）`;
  const map = {
    'index.html': { name: brand, title: `${brand}公式サイト | 俳優・タレント事務所`, description: `${config.description}所属タレントの公式プロフィール・出演情報、映像・舞台・広告などの出演・キャスティング相談をご案内します。`, type: 'WebPage' },
    'talents/index.html': { name: '所属タレント', title: `所属タレント一覧 | ${brand}`, description: `${brand}に所属する俳優・タレント・子役をご紹介します。石原 月斗、中山 結心、月形 陽南、髙島 大幹の宣材写真、プロフィール、出演情報をご覧いただけます。`, type: 'CollectionPage' },
    'about/index.html': { name: '会社概要', title: `会社概要・事業内容 | ${brand}`, description: `${brand}の理念・事業内容・法人情報をご案内します。合同会社S'aimerプロダクションは、俳優・タレントのマネジメントと出演・キャスティングのご相談を承っています。`, type: 'AboutPage' },
    'contact/index.html': { name: 'お問い合わせ', title: `出演依頼・お問い合わせ | ${brand}`, description: `${brand}への出演依頼・キャスティング相談・取材依頼はこちら。映像・舞台・広告などのご相談方法と、ご依頼時にお知らせいただきたい内容をご案内します。`, type: 'ContactPage' },
    'privacy/index.html': { name: 'プライバシーポリシー', title: `プライバシーポリシー | ${brand}`, description: `${brand}のプライバシーポリシー。お問い合わせなどでお預かりする個人情報の利用目的・管理・取り扱いについてご案内します。`, type: 'WebPage' }
  };
  if (map[file]) return map[file];
  const p = person(file, base);
  return { name: `${p.name}のプロフィール`, title: `${p.name} | ${brand}`, description: p.description, type: 'ProfilePage', person: p };
}
function structuredData(file, base, info) {
  const org = {
    '@type': 'Organization', '@id': base + '#organization', name: config.name,
    legalName: config.legalName, alternateName: [config.reading, config.englishName], url: base,
    description: config.description, address: config.address,
    identifier: { '@type': 'PropertyValue', propertyID: '法人番号', value: config.corporateNumber }
  };
  // A pending mailbox is visible on the site but is not an active contact point.
  const contactDom = new JSDOM(read('contact/index.html'));
  const contact = contactDom.window.document.querySelector('[data-contact-email]');
  if (contact?.dataset.contactReady === 'true' && contact.dataset.contactEmail) org.email = contact.dataset.contactEmail;
  contactDom.window.close();
  const website = { '@type': 'WebSite', '@id': base + '#website', url: base, name: config.name, alternateName: [config.reading, config.englishName], inLanguage: 'ja', publisher: { '@id': org['@id'] } };
  const webpage = { '@type': info.type, '@id': urlFor(file, base) + '#webpage', url: urlFor(file, base), name: info.name, description: info.description, inLanguage: 'ja', isPartOf: { '@id': website['@id'] }, about: { '@id': org['@id'] }, primaryImageOfPage: { '@type': 'ImageObject', url: new URL(config.ogImage, base).href, width: 1200, height: 630 } };
  const graph = [org, website, webpage];
  if (info.person) {
    graph.push(info.person.entity);
    webpage.mainEntity = { '@id': info.person.entity['@id'] };
    webpage.primaryImageOfPage = { '@type': 'ImageObject', url: info.person.entity.image[0] };
  } else if (file === 'index.html' || file === 'talents/index.html') {
    const list = { '@type': 'ItemList', '@id': urlFor(file, base) + '#talents', name: '所属タレント', itemListElement: slugs.map((slug, index) => {
      const p = person(`talents/${slug}/index.html`, base);
      return { '@type': 'ListItem', position: index + 1, item: { '@type': 'Person', '@id': p.entity['@id'], name: p.name, url: p.entity.url } };
    }) };
    graph.push(list);
    webpage.mainEntity = { '@id': list['@id'] };
  }
  if (file !== 'index.html') {
    const crumbs = [{ name: config.name, item: base }];
    if (info.person) crumbs.push({ name: '所属タレント', item: urlFor('talents/index.html', base) });
    crumbs.push({ name: info.person?.name || info.name, item: urlFor(file, base) });
    const breadcrumb = { '@type': 'BreadcrumbList', '@id': urlFor(file, base) + '#breadcrumb', itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })) };
    graph.push(breadcrumb);
    webpage.breadcrumb = { '@id': breadcrumb['@id'] };
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
function render(file, html, { production = false, base = production ? config.productionBaseUrl : config.previewBaseUrl } = {}) {
  base = baseUrl(base, production);
  const info = metadata(file, base);
  const canonical = urlFor(file, base);
  const image = new URL(config.ogImage, base).href;
  const tags = [
    `<title>${escape(info.title)}</title>`,
    `<meta name="description" content="${escape(info.description)}">`,
    `<link rel="canonical" href="${escape(canonical)}">`,
    `<meta name="robots" content="${production ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'}">`,
    `<meta property="og:title" content="${escape(info.title)}">`,
    `<meta property="og:description" content="${escape(info.description)}">`,
    `<meta property="og:type" content="${info.person ? 'profile' : 'website'}">`,
    `<meta property="og:url" content="${escape(canonical)}">`,
    `<meta property="og:site_name" content="${escape(config.name)}">`,
    '<meta property="og:locale" content="ja_JP">',
    `<meta property="og:image" content="${escape(image)}">`,
    `<meta property="og:image:secure_url" content="${escape(image)}">`,
    '<meta property="og:image:type" content="image/jpeg">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${escape(config.ogImageAlt)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escape(info.title)}">`,
    `<meta name="twitter:description" content="${escape(info.description)}">`,
    `<meta name="twitter:image" content="${escape(image)}">`,
    `<meta name="twitter:image:alt" content="${escape(config.ogImageAlt)}">`,
    `<script type="application/ld+json" id="seo-structured-data">${JSON.stringify(structuredData(file, base, info)).replaceAll('<', '\\u003c')}</script>`
  ];
  html = html.replace(/\s*<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->\s*/g, '\n');
  html = html.replace(/<title>[\s\S]*?<\/title>\s*/gi, '').replace(/<meta\s+(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>\s*/gi, '').replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '');
  return html.replace('</head>', `  <!-- SEO:START -->\n  ${tags.join('\n  ')}\n  <!-- SEO:END -->\n</head>`);
}
module.exports = { root, config, pages, slugs, render, metadata, structuredData, baseUrl, urlFor, read };
