// node ideal0-re/render.mjs regenerates the matching sections of index.html.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { actors, characters, ensemble, fares, idealRoles, sales, sessions } from './show-data.mjs';

const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const schedule = new Map(sessions.map((session) => [session.id, session]));
const readingCast = characters.flatMap((role) => (role.reading ?? []).map((person) => ({ ...person, role: role.name })));
const assignedActorNames = new Set(actors.map(([name]) => name));
const dateFormat = new Intl.DateTimeFormat('ja-JP', { weekday: 'short', timeZone: 'Asia/Tokyo' });
const number = new Intl.NumberFormat('ja-JP');

assert.equal(schedule.size, sessions.length, 'セッションIDが重複しています');
assert.equal(new Set(readingCast.map(({ id }) => id)).size, readingCast.length, 'READINGのIDが重複しています');
const dateTimes = sessions.map(({ date, time }) => date + 'T' + time);
assert.deepEqual(dateTimes, [...dateTimes].sort(), '開演時刻は昇順で登録してください');
for (const person of readingCast) {
  assert.match(person.id, /^reading-[a-z0-9-]+$/);
  assert.equal(new Set(person.sessions).size, person.sessions.length, "出演回が重複しています");
  for (const id of person.sessions) assert.ok(schedule.has(id), '未登録のセッション: ' + id);
}
for (const { actorRole } of characters) {
  if (actorRole) {
    assert.ok(idealRoles.includes(actorRole.name), 'アイディール役が未登録です');
    assert.ok(assignedActorNames.has(actorRole.performer), 'ACTOR出演者が未登録です');
  }
}

function dateParts(date) {
  const [, month, day] = date.split('-').map(Number);
  return { month, day, weekday: dateFormat.format(new Date(date + 'T12:00:00+09:00')) };
}

function label({ date, time }) {
  const { month, day, weekday } = dateParts(date);
  return `${month}/${day}（${weekday}） ${time}`;
}

function renderPerformer({ id, name, sessions: appearances }) {
  const dates = sessions.filter((session) => appearances.includes(session.id)).map((session) =>
    `<li><a href="#${session.id}">${label(session)}</a></li>`).join('');
  return `<li><details class="performer" id="${id}"><summary>${escape(name)}<small>出演回を見る</small></summary>
    ${dates ? `<ul class="plain-list">${dates}</ul>` : '<p>出演回は後日発表</p>'}</details></li>`;
}

function renderCharacter(role) {
  const roleImage = role.featured ? '<span class="role-icon" aria-hidden="true"></span>' : '';
  const reading = role.reading?.length
    ? `<ul class="performer-list plain-list">${role.reading.map(renderPerformer).join('')}</ul>`
    : '<p class="role-pending">出演者・出演回は後日発表</p>';
  const pair = role.actorRole
    ? `<strong>${escape(role.actorRole.name)}</strong><p>${escape(role.actorRole.performer)} <span>全セッション出演</span></p>`
    : '<p class="role-pending">アイディール役の配役は後日発表</p>';
  return `          <article class="character">
            <div class="character-head"><span class="ribbon">登場人物</span><h3>${escape(role.name)}</h3>
              ${role.note ? `<p>${escape(role.note)}</p>` : ''}</div>
            <div class="character-body">${roleImage}
              <div class="reading-side"><h4 lang="en">READING</h4>${reading}</div>
              <span class="ideal-arrow" aria-hidden="true">IDEAL</span>
              <div class="actor-side"><h4 lang="en">ACTOR</h4>${pair}</div>
            </div>
          </article>`;
}

function nameList(names) {
  return `<ul class="name-list plain-list" role="list">${names.map(([name, affiliation]) =>
    `<li>${escape(name)}${affiliation ? `<small>（${escape(affiliation)}）</small>` : ''}</li>`).join('')}</ul>`;
}

function renderSchedule() {
  const days = new Map();
  for (const session of sessions) {
    const day = days.get(session.date) ?? [];
    day.push(session);
    days.set(session.date, day);
  }
  return [...days].map(([date, times]) => {
    const { month, day, weekday } = dateParts(date);
    const dates = times.map((session) => {
      const { id, time } = session;
      const index = sessions.indexOf(session) + 1;
      const lineup = readingCast.filter(({ sessions: appearances }) => appearances.includes(id));
      const cast = lineup.length ? `<ul class="plain-list schedule-cast">${lineup.map((person) =>
        `<li><a href="#${person.id}">${escape(person.name)} ／ ${escape(person.role)}</a></li>`).join('')}</ul>`
        : '<p>READING出演者は後日発表します。</p>';
      return `                <details class="session" id="${id}">
                  <summary aria-label="${label(session)} 第${index}セッションの出演者"><time datetime="${date}T${time}:00+09:00">${time}</time></summary>
                  <div class="session-detail">
                    <h3>第${index}セッション <span>${label(session)}</span></h3>
                    ${cast}
                    <a href="#actors">全セッション出演のACTORを見る ›</a>
                  </div>
                </details>`;
    }).join('\n');
    return `            <div class="day-row">
              <div class="day-label"><time datetime="${date}">${month}/${day}</time><span class="${weekday === '土' || weekday === '日' ? 'weekend' : 'weekday'}">${weekday}</span></div>
              <div class="day-sessions">
${dates}
              </div>
            </div>`;
  }).join('\n');
}

const vipExtras = `<div class="vip-extras">
              <h4>開演前舞台ツアー</h4>
              <p>開演50分前に開催。出演するおとな小学生メンバーが衣装姿で、実際の舞台上や裏袖などの舞台動線をご案内します。最後に案内メンバーと集合写真を撮影します。</p>
              <p>所要時間は約10分。購入した公演回のみ対象です。指定時間外の開催はできません。</p>
              <p>ツアーガイド：石原美沙紀・花塚廉太郎・三島京華・星野美夢</p>
              <h4>美容整体VIENESSギフトカード</h4>
              <p>美容整体VIENESS池袋店の【全身美容整体＋小顔・骨盤矯正】60分コースチケットです。有効期限があります。</p>
              <a href="https://beauty.hotpepper.jp/kr/slnH000557005/">美容整体VIENESS池袋店の店舗情報 ↗</a>
            </div>`;

function renderFares() {
  return fares.map(({ name, price, highlight, details, fullName }) => `            <details class="fare">
              <summary class="fare-summary">
                <span class="fare-name">${escape(name)}<small>${escape(highlight)}</small></span>
                <strong class="fare-price">¥${number.format(price)}</strong><span class="fare-plus" aria-hidden="true">+</span>
              </summary>
              <div class="fare-details">
                ${fullName ? `<h3>${escape(fullName)}</h3>` : ''}
                <ul>${details.map((line) => `<li>${escape(line)}</li>`).join('')}</ul>
                ${name === 'VIP' ? vipExtras : ''}
              </div>
            </details>`).join('\n');
}

function renderSale() {
  const url = escape(sales.url);
  const caption = 'チケット発売日';
  const status = {
    pending: '<strong lang="en">Coming soon</strong>',
    announced: `<strong>${escape(sales.label ?? '')}</strong>`,
    open: '<strong>販売中</strong>',
    closed: '<strong>販売終了</strong>',
  }[sales.status];
  const buying = sales.status === 'open'
    ? `<a class="button ribbon button-pink purchase" href="${url}">カンフェティでチケットを購入 <span aria-hidden="true">↗</span></a>`
    : `<p class="seller">チケット取扱 <a href="${url}">カンフェティ ↗</a></p>`;
  return `          <div class="ticket-status"><i class="sign-icon ticket-icon" aria-hidden="true"></i><span>${caption}</span>${status}</div>\n          ${buying}`;
}

const parts = {
  characters: characters.filter((role) => role.featured || role.reading?.length || role.actorRole).map(renderCharacter).join('\n'),
  roles: `          <div class="role-columns"><div><h3>登場人物</h3>${nameList(characters.map(({ name }) => [name]))}</div>
            <div><h3>アイディール役</h3>${nameList(idealRoles.map((name) => [name]))}</div></div>`,
  actors: '          ' + nameList(actors),
  ensemble: '          ' + nameList(ensemble),
  schedule: renderSchedule(),
  fares: renderFares(),
  sale: renderSale(),
};

const file = new URL('./index.html', import.meta.url);
let html = readFileSync(file, 'utf8');
for (const [name, value] of Object.entries(parts)) {
  const pattern = new RegExp(`<!-- START:${name} -->[\\s\\S]*?<!-- END:${name} -->`);
  assert.ok(pattern.test(html), 'HTML内の描画位置が見つかりません: ' + name);
  html = html.replace(pattern, () => `<!-- START:${name} -->\n${value}\n<!-- END:${name} -->`);
}
writeFileSync(file, html.replace(/[ \t]+$/gm, ''));
