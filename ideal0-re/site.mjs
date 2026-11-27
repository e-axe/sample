import { characters, ensemble, fares, sales, sessions, venue } from './show-data.mjs';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const jpWeekday = new Intl.DateTimeFormat('ja-JP', { weekday: 'short', timeZone: 'Asia/Tokyo' });
const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' });
const scheduleById = new Map(sessions.map((session) => [session.id, session]));
const readingCast = characters.flatMap(({ name, reading }) => reading.map((person) => ({ ...person, role: name })));
const readingIds = new Set(readingCast.map(({ id }) => id));

function dateParts(date) {
  const [year, month, day] = date.split('-');
  const weekday = jpWeekday.format(new Date(date + 'T12:00:00+09:00'));
  return { year, month: Number(month), day: Number(day), weekday };
}

function sessionLabel({ date, time }) {
  const { month, day, weekday } = dateParts(date);
  return `${month}/${day}（${weekday}） ${time}`;
}

function renderEvent() {
  const first = dateParts(sessions[0].date);
  const last = dateParts(sessions.at(-1).date);
  document.querySelector('[data-event-period]').textContent =
    `${first.year}.${first.month}.${first.day} – ${last.month}.${last.day}`;
  document.querySelectorAll('[data-event-venue]').forEach((element) => { element.textContent = venue; });
  document.querySelector('.hero-event span').append(` ／ 全${sessions.length}ステージ（表示例）`);
}

function renderPerformer(person) {
  const dates = person.sessions.map((id) => {
    const session = scheduleById.get(id);
    return `<li><a href="#${escapeHtml(id)}">${escapeHtml(sessionLabel(session))}</a></li>`;
  }).join('');
  const times = dates ? `<ul class="performer-sessions" role="list">${dates}</ul>` : '<p>出演回は後日発表</p>';
  return `<li><details class="performer" id="${escapeHtml(person.id)}">
    <summary><span>${escapeHtml(person.name)}</span><small>出演回を見る <span aria-hidden="true">▾</span></small></summary>
    ${times}
  </details></li>`;
}

function renderCast() {
  document.getElementById('characters').innerHTML = characters.map((role) => {
    const visual = role.image
      ? `<img class="role-photo" src="./assets/${escapeHtml(role.image)}" alt="" width="264" height="264" loading="lazy" decoding="async">`
      : '<span class="role-mark" aria-hidden="true">✦</span>';
    return `<article class="character">
      <div class="character-profile">${visual}<div><h3>${escapeHtml(role.name)}</h3><p>${escapeHtml(role.note)}</p></div></div>
      <div class="character-side character-reading"><h4 class="cast-label" lang="en">READING</h4>
        <ul class="performer-list" role="list">${role.reading.map(renderPerformer).join('')}</ul>
      </div>
      <div class="character-side character-actor"><h4 class="cast-label" lang="en">ACTOR</h4>
        <p class="actor-sub">アイディール役</p>
        <p class="actor-name"><span lang="en">${escapeHtml(role.actor)}</span> <small>全セッション出演</small></p>
      </div>
    </article>`;
  }).join('');
  document.getElementById('ensemble-list').innerHTML =
    ensemble.map((name) => `<li>${escapeHtml(name)}</li>`).join('');
}

function renderSchedule() {
  const byDay = new Map();
  for (const session of sessions) {
    if (!byDay.has(session.date)) byDay.set(session.date, []);
    byDay.get(session.date).push(session);
  }
  document.getElementById('schedule-list').innerHTML = [...byDay].map(([date, dailySessions]) => {
    const { month, day, weekday } = dateParts(date);
    const weekend = weekday === '土' || weekday === '日' ? ' class="weekend"' : '';
    const times = dailySessions.map((session) => {
      const id = escapeHtml(session.id);
      return `<button class="session-button" type="button" id="${id}" aria-expanded="false" aria-controls="${id}-detail" aria-label="${escapeHtml(sessionLabel(session))}の出演者">
        <time datetime="${date}T${session.time}:00+09:00">${session.time}</time><span aria-hidden="true">+</span>
      </button>`;
    }).join('');
    const panels = dailySessions.map((session) => {
      const performers = readingCast.filter((person) => person.sessions.includes(session.id));
      const list = performers.length
        ? `<ul class="schedule-cast" role="list">${performers.map((person) =>
          `<li><a href="#${escapeHtml(person.id)}">${escapeHtml(person.name)} ／ ${escapeHtml(person.role)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul>`
        : '<p>この回の出演者は後日発表します。</p>';
      return `<div class="session-detail" id="${escapeHtml(session.id)}-detail" hidden>
        <h4>${escapeHtml(sessionLabel(session))} <span lang="en">READING</span></h4>${list}
      </div>`;
    }).join('');
    return `<div class="day-row">
      <h4 class="day-label"><time datetime="${date}">${month}/${day}</time><span${weekend}>${weekday}</span></h4>
      <div class="day-sessions">${times}${panels}</div>
    </div>`;
  }).join('');
}

function renderTickets() {
  document.getElementById('ticket-list').innerHTML = fares.map((fare) => `<details class="fare">
    <summary class="fare-summary">
      <span class="fare-name">${escapeHtml(fare.name)}<small class="fare-highlight">${escapeHtml(fare.highlight)}</small></span>
      <strong class="fare-price">${yen.format(fare.price)}</strong><span class="fare-plus" aria-hidden="true">+</span>
    </summary>
    <div class="fare-details"><h4>${escapeHtml(fare.fullName ?? fare.name)}の詳細</h4>
      <ul>${fare.details.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
    </div>
  </details>`).join('');
  const status = document.getElementById('sale-status');
  if (sales.status === 'announced' && sales.label) {
    status.lang = 'ja';
    status.textContent = sales.label;
  }
  if (sales.status === 'open' && sales.url?.startsWith('https://')) {
    const purchase = document.getElementById('purchase');
    document.getElementById('sale-caption').hidden = true;
    status.lang = 'ja';
    status.textContent = 'チケット販売中';
    purchase.href = sales.url;
    purchase.hidden = false;
  }
  if (sales.status === 'closed') {
    status.lang = 'ja';
    status.textContent = sales.label ?? '販売終了';
  }
}

renderEvent();
renderCast();
renderSchedule();
renderTickets();

const nav = document.getElementById('site-nav');
const menu = document.querySelector('.menu-toggle');

function toggleMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
}

menu.parentElement.classList.add('has-menu');
menu.hidden = false;
menu.addEventListener('click', () => toggleMenu(menu.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    toggleMenu(false);
    menu.focus();
  }
});
nav.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || menu.getAttribute('aria-expanded') !== 'true') return;
  toggleMenu(false);
  const heading = document.querySelector(link.hash).querySelector('h2, h3');
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
});

let activeSession;

function showSession(id) {
  if (activeSession) {
    activeSession.setAttribute('aria-expanded', 'false');
    activeSession.querySelector('span').textContent = '+';
    document.getElementById(activeSession.getAttribute('aria-controls')).hidden = true;
  }
  activeSession = id ? document.getElementById(id) : undefined;
  if (activeSession) {
    activeSession.setAttribute('aria-expanded', 'true');
    activeSession.querySelector('span').textContent = '−';
    document.getElementById(activeSession.getAttribute('aria-controls')).hidden = false;
  }
}

function openLinkedSection(id, moveFocus) {
  const target = document.getElementById(id);
  if (scheduleById.has(id)) showSession(id);
  else if (readingIds.has(id)) target.open = true;
  else return;

  if (moveFocus) {
    const focusTarget = target.matches('details') ? target.querySelector('summary') : target;
    focusTarget.focus({ preventScroll: true });
  }
  target.scrollIntoView({ block: 'start' });
}

document.getElementById('schedule-list').addEventListener('click', (event) => {
  const button = event.target.closest('.session-button');
  if (!button) return;
  const next = activeSession === button ? undefined : button.id;
  showSession(next);
  const hash = '#' + (next ?? 'schedule');
  if (location.hash !== hash) history.pushState(null, '', hash);
});

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const id = link.hash.slice(1);
  if (!scheduleById.has(id) && !readingIds.has(id)) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  openLinkedSection(id, true);
});

function syncHash() {
  const id = location.hash.slice(1);
  if (id === 'schedule') showSession();
  else openLinkedSection(id, false);
}
window.addEventListener('hashchange', syncHash);
if (location.hash) requestAnimationFrame(syncHash);

const mobileCta = document.querySelector('.mobile-cta');
const heroButton = document.querySelector('.hero-links .button');
const booking = document.querySelector('.booking');
const header = document.querySelector('.site-header');
const compact = window.matchMedia('(max-width: 850px)');
let queued = false;

function updateMobileCta() {
  queued = false;
  const headerBottom = header.getBoundingClientRect().bottom;
  mobileCta.hidden = !compact.matches
    || heroButton.getBoundingClientRect().bottom > headerBottom
    || booking.getBoundingClientRect().top < window.innerHeight;
}

function queueMobileCta() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(updateMobileCta);
}

window.addEventListener('scroll', queueMobileCta, { passive: true });
window.addEventListener('resize', queueMobileCta);
queueMobileCta();
