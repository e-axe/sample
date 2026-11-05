import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {getSaleState} from '../sale-state.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const d=JSON.parse(await readFile(path.join(root,'content.json'),'utf8'));
assert.equal(d.cast.length,36);assert.equal(d.shows.length,9);
assert.equal(new Set(d.cast.map(c=>c.id)).size,36);
assert.equal(new Set(d.cast.map(c=>c.name)).size,36);
// Independent transcription of the official 11/5 role-by-date chart.
const chart={
 'コメ子':['佐々木琴子','佐々木琴子','佐々木琴子','佐々木琴子','佐々木琴子'],
 'ムギ美':['吉武千颯','八木ましろ','吉武千颯','吉武千颯','八木ましろ'],
 'アワ和':['加藤結','小日向美香','加藤結','小日向美香','加藤結'],
 'キビ崎':['広瀬ゆうき','田中咲帆','田中咲帆','広瀬ゆうき','田中咲帆'],
 'マメ乃':['水湊美緒','水湊美緒','原田彩楓','原田彩楓','水湊美緒'],
 'ざこざこ':['中澤ミナ','深川瑠華','真野美月','真野美月','中澤ミナ'],
 'AKI':['石原美沙紀','石原美沙紀','石原美沙紀','石原美沙紀','石原美沙紀'],
 'NIMO':['三田美吹','三田美吹','三田美吹','三田美吹','三田美吹'],
 'KURARA':['阿部寿世','中村朱里','阿部寿世','阿部寿世','中村朱里'],
 'SERIMU':['城崎桃華','城崎桃華','小越春花','小越春花','城崎桃華'],
 'YOMONE':['結城りな','結城りな','湯本亜美','結城りな','湯本亜美'],
 'RANON':['藍本あみ','延松舞佳','延松舞佳','藍本あみ','藍本あみ'],
 'えるえる':['夏目妃菜','星野美夢','夏目妃菜','夏目妃菜','星野美夢'],
 'リブラ':['岡本芽子','岡本芽子','岡本芽子','岡本芽子','岡本芽子'],
 'ピスケス':['村星りじゅ','佐倉薫','佐倉薫','村星りじゅ','村星りじゅ'],
 'カンケル':['蛭田愛梨','蛭田愛梨','本多しおり','本多しおり','蛭田愛梨'],
 'ヴィルゴ':['三葉海緒','三葉海緒','西尾桃子','三葉海緒','西尾桃子'],
 'ぺぬぺぬ':['天音みほ','天音みほ','天音みほ','福嶋晴菜','福嶋晴菜'],
 '神':['香坂さき','相良茉優','相良茉優','香坂さき','汐入あすか']
};
for(const s of d.shows){
 const people=d.cast.filter(c=>c.shows.includes(s.id));assert.equal(people.length,19,`show ${s.id} cast count`);
 for(const [role,names] of Object.entries(chart)){const assigned=people.filter(c=>c.role===role);assert.equal(assigned.length,1,`${role} show ${s.id}`);assert.equal(assigned[0].name,names[s.day-16]);}
 const date=new Date(`2026-12-${s.day}T${s.time}:00+09:00`);
 assert.equal(['日','月','火','水','木','金','土'][new Date(date.toLocaleString('en-US',{timeZone:'Asia/Tokyo'})).getDay()],s.weekday);
}
assert.equal(new Set(d.cast.map(c=>c.imageNumber)).size,36);
for(const c of d.cast){assert.equal(new Set(c.shows).size,c.shows.length);assert(c.shows.every(n=>d.shows.some(s=>s.id===n)));assert(Number.isInteger(c.imageNumber)&&c.imageNumber>0);await access(path.join(root,`assets/cast/kawaii-re-cast-${String(c.imageNumber).padStart(2,'0')}.${c.source?'webp':'svg'}`));}
const html=await readFile(path.join(root,'index.html'),'utf8');assert(!html.includes('{{'));assert.equal((html.match(/class="cast-card"/g)||[]).length,36);
for(const match of html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)){if(!/^(https?:|mailto:)/.test(match[1]))await access(path.join(root,match[1]));}
assert.equal(Date.parse(d.saleAt),Date.UTC(2026,10,12,13));
assert.equal(d.ticketUrl,'https://confetti-web.com/@/may-holic23');
const sale=Date.parse(d.saleAt),end=Date.parse(d.endsAt);
assert.equal(getSaleState(sale-1,d.saleAt,d.endsAt),'upcoming');
assert.equal(getSaleState(sale,d.saleAt,d.endsAt),'open');
assert.equal(getSaleState(end-1,d.saleAt,d.endsAt),'open');
assert.equal(getSaleState(end,d.saleAt,d.endsAt),'ended');
assert.equal(getSaleState(end+86400000,d.saleAt,d.endsAt),'ended');
assert(!html.includes('id="all-cast"'));
assert(!html.includes('<details class="story-details"'));
assert(!html.slice(html.indexOf('<section class="hero"'),html.indexOf('<section id="story"')).includes('上演時間'));
assert(html.indexOf('id="show-results"')<html.indexOf('class="ticket-grid"'));
assert(html.indexOf('class="purchase-reminder"')<html.indexOf('data-sale-link'));
assert(html.includes('https://x.com/mayholictheater'));
assert(html.includes('title="CBGKシブゲキ!! 周辺地図"'));
assert(!html.includes('>会場<'));
console.log('PASS: official role chart × 9 shows, 36 cast, local links/assets, release timezone, generated HTML');
