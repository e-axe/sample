import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await readFile(path.join(root,'content.json'),'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
const date=s=>`12/${s.day}（${s.weekday}）${s.time}`;
const days=c=>c.shows.length===9?'全9公演':[...new Set(c.shows.map(id=>data.shows.find(s=>s.id===id).day))].map((v,i)=>i===0?`12/${v}`:v).join('・');
const card=c=>`<article class="cast-card"><img src="assets/cast/${c.id}.${c.source?'webp':'svg'}" width="320" height="320" loading="lazy" decoding="async" alt="${esc(c.name)}${c.source?'':'（写真準備中）'}" style="object-position:${c.position}"><h3>${esc(c.name)}</h3><p class="affiliation">${esc(c.affiliation||'')}</p><p class="cast-days">${days(c)}</p><p class="role">${esc(c.role)} 役${c.source?'':' / 写真準備中'}</p><a class="text-link" href="#ticket" data-cast="${c.id}">出演回を見る${arrow}</a><p class="no-js-dates">${c.shows.map(id=>date(data.shows.find(s=>s.id===id))).join(' / ')}</p></article>`;
// Keep the approved six-person first row; expand into the complete official billing order.
const firstIds=['sasaki-kotoko','sagara-mayu','yagi-mashiro','yoshitake-chihaya','kohinata-mika','kato-yui'];
const first=firstIds.map(id=>data.cast.find(c=>c.id===id));
const rest=data.cast.filter(c=>!firstIds.includes(c.id));
const calendar=[16,17,18,19,20].map(day=>{const shows=data.shows.filter(s=>s.day===day);return `<tr><th scope="row"><span>12.${day}</span><small>（${shows[0].weekday}）</small></th><td>${shows.map(s=>`<button type="button" class="show-button" data-show="${s.id}" aria-pressed="false" aria-label="12月${s.day}日 ${s.time} 本番${s.id}の出演者を見る">${s.time}</button>`).join('<span class="time-divider" aria-hidden="true">/</span>')}</td></tr>`;}).join('');
const template=await readFile(path.join(root,'template.html'),'utf8');
const html=template.replace('{{FIRST_CAST}}',first.map(card).join('\n')).replace('{{MORE_CAST}}',rest.map(card).join('\n')).replace('{{CALENDAR}}',calendar).replace('{{CAST_OPTIONS}}',data.cast.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')).replace('{{DATA}}',JSON.stringify(data).replace(/</g,'\\u003c'));
await writeFile(path.join(root,'index.html'),html);
console.log(`Built ${data.cast.length} cast / ${data.shows.length} shows`);
