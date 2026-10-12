const fs = require('node:fs');
const path = require('node:path');
const seo = require('./seo.cjs');
for (const file of seo.pages) fs.writeFileSync(path.join(seo.root, file), seo.render(file, seo.read(file)));
fs.writeFileSync(path.join(seo.root, 'robots.txt'), '# Preview is excluded by meta noindex on every page. This file is below the host root.\nUser-agent: *\nAllow: /sample/saimer-pro/\n');
fs.writeFileSync(path.join(seo.root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n');
console.log('Preview SEO updated: 9 pages remain noindex; no preview URLs submitted in sitemap.');
