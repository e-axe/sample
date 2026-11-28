// node ideal0-re/render.mjs regenerates the matching sections of index.html.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { actors, characters, ensemble, fares, idealRoles, sales, sessions } from './show-data.mjs';
import { castPreview } from './cast-preview.mjs';

const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const schedule = new Map(sessions.map((session) => [session.id, session]));
const readingCast = characters.flatMap((role) => (role.reading ?? []).map((person) => ({ ...person, role: role.name })));
const castCharacters = characters.filter((role) => role.reading?.length || role.actorRole);
const previewCasting = castCharacters.length === 0;
const scheduleReading = previewCasting
  ? castPreview.flatMap(({ name: role, reading }) => reading.map((person) => ({ ...person, role })))
  : readingCast;
const actorPortraits = new Map(actors.map(([name, , image]) => [name, image]));
const dateFormat = new Intl.DateTimeFormat('ja-JP', { weekday: 'short', timeZone: 'Asia/Tokyo' });
const number = new Intl.NumberFormat('ja-JP');
const rosterKey = (group, name) => `${group}:${name}`;

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
    assert.ok(actorPortraits.has(actorRole.performer), 'ACTOR出演者が未登録です');
  }
}
for (const [name, , , appearances = []] of ensemble) {
  assert.equal(new Set(appearances).size, appearances.length, `出演回が重複しています: ${name}`);
  for (const id of appearances) assert.ok(schedule.has(id), `未登録のセッション: ${id}`);
}

function dateParts(date) {
  const [, month, day] = date.split('-').map(Number);
  return { month, day, weekday: dateFormat.format(new Date(date + 'T12:00:00+09:00')) };
}

function label({ date, time }) {
  const { month, day, weekday } = dateParts(date);
  return `${month}/${day}（${weekday}） ${time}`;
}

function renderPortrait(image) {
  const file = image ?? 'cast-avatar.svg';
  return `<img class="cast-portrait${image ? '' : ' cast-portrait-placeholder'}" src="./assets/${escape(file)}" width="200" height="200" loading="lazy" decoding="async" alt="">`;
}

function renderPortraitLink(image, name, id) {
  return `<a class="cast-portrait-link" href="?performer=${encodeURIComponent(id)}#schedule" aria-label="${escape(name)}の出演日を見る">${renderPortrait(image)}</a>`;
}

function renderPerformer({ id, name, image }) {
  return `<li class="performer" id="${id}" tabindex="-1">${renderPortraitLink(image, name, id)}<strong>${escape(name)}</strong></li>`;
}

function renderCharacter(role) {
  const reading = role.reading?.length
    ? `<ul class="performer-list plain-list" role="list">${role.reading.map(renderPerformer).join('')}</ul>`
    : '<p class="role-pending">出演者は後日発表</p>';
  const actorRole = role.actorRole;
  const pair = actorRole
    ? `<div class="paired-actor">${renderPortraitLink(actorRole.image ?? actorPortraits.get(actorRole.performer), actorRole.performer, previewCasting ? actorRole.id : rosterKey('actor', actorRole.performer))}<div><strong>${escape(actorRole.name).replaceAll('・', '・<wbr>')}</strong><p>${escape(actorRole.performer)}</p></div></div>`
    : '<p class="role-pending">アイディール役の配役は後日発表</p>';
  return `            <article class="character">
              <header class="character-head"><h4>${escape(role.name)}</h4>${role.note ? `<p>${escape(role.note)}</p>` : ''}</header>
              <div class="character-body">
                <div class="reading-side"><h5 class="cast-role-title" lang="en">READING</h5>${reading}</div>
                <div class="actor-side"><h5 class="cast-role-title"><span lang="en">ACTOR</span><span class="ideal-owner">${escape(role.name)}のアイディール</span></h5>${pair}</div>
              </div>
            </article>`;
}

function renderRoleCatalogue() {
  const assignedIdeals = new Set(castCharacters.flatMap(({ actorRole }) => actorRole ? [actorRole.name] : []));
  const groups = [
    { title: '登場人物', names: characters.filter((role) => !castCharacters.includes(role)).map(({ name }) => name) },
    { title: 'アイディール役', names: idealRoles.filter((name) => !assignedIdeals.has(name)) },
  ].filter(({ names }) => names.length);
  if (!groups.length) return '';
  return `            <div class="role-catalogue">
              ${groups.map(({ title, names }) => `<div class="role-panel">
                <h4>${title}</h4>
                <ul class="role-names plain-list" role="list">${names.map((name) => `<li>${escape(name)}</li>`).join('')}</ul>
              </div>`).join('\n              ')}
            </div>`;
}

function renderCastGrid(cast, group) {
  return `          <ul class="cast-grid plain-list" role="list">
${cast.map(([name, affiliation, image]) => `            <li class="cast-card">
              ${renderPortraitLink(image, name, rosterKey(group, name))}
              <div class="cast-card-caption">
                <strong>${escape(name)}</strong>${affiliation ? `<small>${escape(affiliation)}</small>` : ''}
              </div>
            </li>`).join('\n')}
          </ul>`;
}

function renderScheduleFilter() {
  const allAppearances = sessions.map(({ id }) => id);
  const groups = [
    { label: previewCasting ? 'READING（仮）' : 'READING', people: scheduleReading },
    {
      label: 'アイディール（仮）',
      people: previewCasting ? castPreview.map(({ name: role, actorRole }) => ({
        ...actorRole, name: actorRole.performer, role, sessions: allAppearances,
      })) : [],
    },
    { label: 'ACTOR', people: actors.map(([name]) => ({ name, id: rosterKey('actor', name), sessions: allAppearances })) },
    { label: 'アンサンブル', people: ensemble.map(([name, , , appearances = []]) => ({ name, id: rosterKey('ensemble', name), sessions: appearances })) },
  ];
  const options = groups.map(({ label: groupLabel, people }) => {
    if (!people.length) return '';
    return `              <optgroup label="${groupLabel}">
${people.map((person) => `                <option value="${escape(person.id)}" data-sessions="${person.sessions.join(' ')}">${escape(person.name)}${person.role ? ` ／ ${escape(person.role)}` : ''}</option>`).join('\n')}
              </optgroup>`;
  }).filter(Boolean).join('\n');
  return `${previewCasting ? '          <p class="schedule-preview-note">READINGとアイディールの出演情報は確認用の仮表示です。</p>\n' : ''}          <div class="schedule-filter" hidden>
            <label for="schedule-performer">出演者から出演回を探す</label>
            <select id="schedule-performer" aria-controls="schedule-list">
              <option value="">全日程を表示</option>
${options}
            </select>
            <p class="schedule-results" role="status"></p>
          </div>`;
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
      const lineup = scheduleReading.filter(({ sessions: appearances }) => appearances.includes(id));
      const cast = lineup.length ? `<ul class="plain-list schedule-cast">${lineup.map((person) =>
        `<li><a href="#${person.id}"><strong>${escape(person.name)}</strong><small>${escape(person.role)}</small></a></li>`).join('')}</ul>`
        : '<p>READING出演者は後日発表します。</p>';
      return `                <details class="session" id="${id}">
                  <summary aria-label="${label(session)} 第${index}セッションの出演者"><time datetime="${date}T${time}:00+09:00">${time}</time></summary>
                  <div class="session-detail">
                    <h3>第${index}セッション <span>${label(session)}</span></h3>
                    ${previewCasting ? '<p class="schedule-lineup-label">READING出演者（仮）</p>' : ''}
                    ${cast}
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
              <a href="https://beauty.hotpepper.jp/kr/slnH000557005/" target="_blank" rel="noopener">美容整体VIENESS池袋店の店舗情報 ↗</a>
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
    pending: '<strong>後日発表</strong>',
    announced: `<strong>${escape(sales.label ?? '')}</strong>`,
    open: '<strong>販売中</strong>',
    closed: '<strong>販売終了</strong>',
  }[sales.status];
  const buying = sales.status === 'open'
    ? `<a class="button ribbon button-pink purchase" href="${url}" target="_blank" rel="noopener">カンフェティでチケットを購入 <span aria-hidden="true">↗</span></a>`
    : `<p class="seller">チケット取扱 <a href="${url}" target="_blank" rel="noopener">カンフェティ ↗</a></p>`;
  return `          <div class="ticket-status"><i class="sign-icon ticket-icon" aria-hidden="true"></i><span>${caption}</span>${status}</div>\n          ${buying}`;
}

const parts = {
  characters: `${previewCasting ? '            <p class="cast-preview-note"><strong>配役プレビュー</strong> 役の組み合わせ・出演者・写真は確認用の仮表示です。</p>\n' : ''}            <div class="character-list">\n${(previewCasting ? castPreview : castCharacters).map(renderCharacter).join('\n')}\n            </div>`,
  roles: previewCasting ? '' : renderRoleCatalogue(),
  actors: renderCastGrid(actors, 'actor'),
  ensemble: renderCastGrid(ensemble, 'ensemble'),
  'schedule-filter': renderScheduleFilter(),
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
