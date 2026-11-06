import { getSaleState } from './sale-state.mjs';

const data = JSON.parse(document.getElementById('performance-data').textContent);
const filter = document.getElementById('cast-filter');
const results = document.getElementById('show-results');
const heading = document.getElementById('results-heading');
const list = document.getElementById('result-list');
const status = document.getElementById('result-status');
const selectionSummary = document.getElementById('selection-summary');
const clearShow = document.getElementById('clear-show');
const clearCast = document.getElementById('clear-cast');
const resultClearShow = document.getElementById('result-clear-show');
const showButtons = [...document.querySelectorAll('[data-show]')];
const peopleByShow = new Map(data.shows.map(show => [show.id, data.cast.filter(person => person.shows.includes(show.id))]));
const nav = document.getElementById('navigation');
const menu = document.querySelector('.menu-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const label = show => `12/${show.day}（${show.weekday}）${show.time}`;
let selectedShow = null;
document.documentElement.classList.add('js');
document.documentElement.classList.remove('no-js');
document.body.classList.add('ready');

function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  nav.classList.remove('is-open');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
});
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu(); menu.focus();
  }
});
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
matchMedia('(min-width: 1101px)').addEventListener('change', closeMenu);

function render() {
  const cast = data.cast.find(person => person.id === filter.value);
  const shows = data.shows.filter(show => (!cast || cast.shows.includes(show.id)) && (!selectedShow || show.id === selectedShow));
  showButtons.forEach(button => {
    const id = Number(button.dataset.show);
    const unavailable = Boolean(cast && !cast.shows.includes(id));
    button.disabled = unavailable;
    button.setAttribute('aria-pressed', String(selectedShow === id));
    button.setAttribute('aria-label', `12月${data.shows.find(show => show.id === id).day}日 ${button.firstElementChild.textContent}${selectedShow === id ? ' 選択中。もう一度押すと日時を解除' : 'の出演者を見る'}`);
    button.querySelector('.show-selected').hidden = selectedShow !== id;
    button.closest('.show-slot').classList.toggle('is-unavailable', unavailable);
    button.nextElementSibling.hidden = !unavailable;
  });
  const show = data.shows.find(show => show.id === selectedShow);
  selectionSummary.textContent = `${cast ? `出演者：${cast.name}` : '出演者：指定なし'}\n${show ? `日時：${label(show)} 開演` : '日時：指定なし（すべての公演）'}`;
  clearShow.hidden = !selectedShow;
  clearCast.hidden = !cast;
  // With a cast filter, let visitors return to all of that person's shows without leaving the results.
  resultClearShow.hidden = !(cast && selectedShow);
  if (cast) resultClearShow.textContent = `日時を解除（全${cast.shows.length}公演を表示）`;
  results.hidden = !cast && !selectedShow;
  list.replaceChildren();
  if (results.hidden) return;
  heading.textContent = cast ? `${cast.name}さんの出演公演` : '選択した公演の出演者';
  status.textContent = cast
    ? `${shows.length}公演${selectedShow ? 'を選択中' : 'に出演'}。日時をご確認ください。`
    : 'この公演に出演するキャストをご確認ください。';
  const fragment = document.createDocumentFragment();
  for (const show of shows) {
    const article = document.createElement('article');
    article.className = 'result-show';
    const title = document.createElement('h4');
    const date = document.createElement('span');
    date.className = 'result-date';
    date.textContent = `12.${show.day}`;
    const time = document.createElement('span');
    time.className = 'result-time';
    time.textContent = `（${show.weekday}）${show.time} 開演`;
    title.append(date, time);
    const showHead = document.createElement('div');
    showHead.className = 'result-show-head';
    const selection = document.createElement(selectedShow ? 'span' : 'button');
    selection.className = selectedShow ? 'selection-label' : 'select-result-show';
    selection.textContent = selectedShow ? '選択中の公演' : 'この公演を選択';
    if (!selectedShow) { selection.type = 'button'; selection.dataset.selectShow = show.id; selection.setAttribute('aria-label', `${label(show)}の公演を選択`); }
    showHead.append(title, selection);
    article.append(showHead);
    const details = document.createElement('details');
    details.open = Boolean(selectedShow);
    const summary = document.createElement('summary');
    const people = peopleByShow.get(show.id);
    summary.textContent = `出演者 ${people.length}名`;
    const names = document.createElement('ul');
    names.className = 'result-cast';
    // Populate portraits only for an opened show; a search need not build 171 cards.
    let populated = false;
    function populate() {
      if (!details.open || populated) return;
      populated = true;
      people.forEach(person => {
      const item = document.createElement('li');
      item.className = person.id === filter.value ? 'is-matched' : '';
      const picture = document.createElement('img');
      picture.src = `assets/cast/kawaii-re-cast-${String(person.imageNumber).padStart(2, '0')}.${person.source ? 'webp' : 'svg'}`;
      picture.width = picture.height = 80;
      picture.alt = '';
      picture.loading = 'lazy';
      picture.decoding = 'async';
      const info = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = person.name;
      const role = document.createElement('span');
      role.className = 'result-role';
      role.textContent = `${person.role} 役`;
      info.append(name, role);
      item.append(picture, info);
      names.append(item);
      });
      details.append(names);
    }
    details.addEventListener('toggle', populate);
    populate();
    details.prepend(summary);
    article.append(details);
    fragment.append(article);
  }
  list.append(fragment);
}

filter.addEventListener('change', () => { selectedShow = null; render(); });
document.querySelector('.cast-grid').addEventListener('click', event => {
  const link = event.target.closest('[data-cast]');
  if (!link) return;
  event.preventDefault();
  filter.value = link.dataset.cast;
  selectedShow = null;
  render();
  filter.focus({ preventScroll: true });
  document.getElementById('cast-finder').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
});
function selectShow(id, fromResults = false) {
  selectedShow = selectedShow === id ? null : id;
  render();
  if (fromResults && !results.hidden) {
    heading.focus({ preventScroll: true });
    results.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  }
}
showButtons.forEach(button => button.addEventListener('click', () => {
  if (!button.disabled) selectShow(Number(button.dataset.show));
}));
list.addEventListener('click', event => {
  const button = event.target.closest('[data-select-show]');
  if (button) selectShow(Number(button.dataset.selectShow), true);
});
clearShow.addEventListener('click', () => {
  const previous = selectedShow;
  selectedShow = null; render();
  showButtons.find(button => Number(button.dataset.show) === previous)?.focus({ preventScroll: true });
});
clearCast.addEventListener('click', () => {
  filter.value = ''; render(); filter.focus({ preventScroll: true });
});
resultClearShow.addEventListener('click', () => {
  selectedShow = null; render();
  heading.focus({ preventScroll: true });
  results.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
});
document.getElementById('reset-filter').addEventListener('click', () => {
  filter.value = ''; selectedShow = null; render(); filter.focus();
});
render();

let lastSaleState;
let saleTimer;
function updateSale() {
  clearTimeout(saleTimer);
  const state = getSaleState(Date.now(), data.saleAt, data.endsAt);
  if (state !== lastSaleState) {
    lastSaleState = state;
    document.body.dataset.saleState = state;
    const upcoming = state === 'upcoming';
    const ended = state === 'ended';
    document.querySelectorAll('[data-sale-link]').forEach(link => {
      link.setAttribute('aria-disabled', String(upcoming || ended));
      link.href = state === 'open' ? data.ticketUrl : '#ticket';
    });
    document.querySelectorAll('[data-sale-cta]').forEach(text => {
      text.textContent = upcoming ? '11/12 22:00 発売開始' : ended ? '公演は終了しました' : 'チケット販売ページへ';
    });
    document.querySelectorAll('[data-sale-label]').forEach(text => {
      text.textContent = upcoming ? '11/12（木）22:00 発売開始｜先着順' : ended ? '公演は終了しました。ご来場ありがとうございました。' : 'チケットの販売状況はカンフェティでご確認ください。';
    });
    document.querySelectorAll('[data-sale-note]').forEach(text => {
      text.textContent = upcoming ? '発売日時になると販売ページへ進めます。' : ended ? '最新のご案内は公式ブログ・公式Xをご確認ください。' : '出演日と券種をご確認のうえ、販売ページへお進みください。';
    });
  }
  if (state !== 'ended') {
    const next = Date.parse(state === 'upcoming' ? data.saleAt : data.endsAt);
    saleTimer = setTimeout(updateSale, Math.min(Math.max(next - Date.now(), 1), 86400000));
  }
}
document.querySelectorAll('[data-sale-link]').forEach(link => link.addEventListener('click', event => {
  updateSale();
  if (lastSaleState !== 'open') event.preventDefault();
}));
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateSale(); });
window.addEventListener('pageshow', () => { render(); updateSale(); });
updateSale();

if ('IntersectionObserver' in window) {
  const visibleCtas = new Map();
  const ctaObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => visibleCtas.set(entry.target, entry.isIntersecting));
    document.body.classList.toggle('has-visible-ticket-cta', [...visibleCtas.values()].some(Boolean));
  });
  document.querySelectorAll('.hero-cta, #ticket').forEach(element => ctaObserver.observe(element));
  if (!reducedMotion.matches) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    }), { threshold: 0.1 });
    document.querySelectorAll('.section-head, .story-art').forEach(element => {
      element.classList.add('reveal'); revealObserver.observe(element);
    });
    document.body.classList.add('motion-ready');
  }
}
