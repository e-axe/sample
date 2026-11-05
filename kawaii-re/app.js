import { getSaleState } from './sale-state.mjs';

const data = JSON.parse(document.getElementById('performance-data').textContent);
const filter = document.getElementById('cast-filter');
const results = document.getElementById('show-results');
const heading = document.getElementById('results-heading');
const list = document.getElementById('result-list');
const status = document.getElementById('result-status');
const nav = document.getElementById('navigation');
const menu = document.querySelector('.menu-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const label = show => `12/${show.day}（${show.weekday}）${show.time}`;
let selectedShow = null;
document.documentElement.classList.add('js');
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

function render() {
  const cast = data.cast.find(person => person.id === filter.value);
  const shows = data.shows.filter(show => (!cast || cast.shows.includes(show.id)) && (!selectedShow || show.id === selectedShow));
  document.querySelectorAll('[data-show]').forEach(button => {
    const id = Number(button.dataset.show);
    const unavailable = Boolean(cast && !cast.shows.includes(id));
    button.disabled = unavailable;
    button.setAttribute('aria-pressed', String(selectedShow === id));
    button.closest('.show-slot').classList.toggle('is-unavailable', unavailable);
    button.nextElementSibling.hidden = !unavailable;
  });
  results.hidden = !cast && !selectedShow;
  list.replaceChildren();
  if (results.hidden) return;
  heading.textContent = cast ? `${cast.name}さんの出演公演` : '選択した公演の出演者';
  status.textContent = cast
    ? `${shows.length}公演${selectedShow ? 'を選択中' : 'に出演'}。日時をご確認ください。`
    : 'この公演に出演するキャストをご確認ください。';
  for (const show of shows) {
    const article = document.createElement('article');
    article.className = 'result-show';
    const title = document.createElement('h4');
    title.textContent = `${label(show)} ｜ 本番${show.id}`;
    article.append(title);
    const details = document.createElement('details');
    details.open = Boolean(selectedShow);
    const summary = document.createElement('summary');
    summary.textContent = 'この回の出演者を見る（19名）';
    const names = document.createElement('p');
    data.cast.filter(person => person.shows.includes(show.id)).forEach((person, index) => {
      if (index) names.append(' ／ ');
      const name = document.createElement(person.id === filter.value ? 'strong' : 'span');
      name.textContent = person.name;
      names.append(name);
    });
    details.append(summary, names);
    article.append(details);
    list.append(article);
  }
}

filter.addEventListener('change', () => { selectedShow = null; render(); });
document.querySelectorAll('[data-cast]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  filter.value = link.dataset.cast;
  selectedShow = null;
  render();
  filter.focus({ preventScroll: true });
  document.getElementById('cast-finder').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
}));
document.querySelectorAll('[data-show]').forEach(button => button.addEventListener('click', () => {
  if (button.disabled) return;
  const id = Number(button.dataset.show);
  selectedShow = selectedShow === id ? null : id;
  render();
  if (!results.hidden) {
    heading.focus({ preventScroll: true });
    results.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  }
}));
document.getElementById('reset-filter').addEventListener('click', () => {
  filter.value = ''; selectedShow = null; render(); filter.focus();
});

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
    document.querySelectorAll('.section-head, .story-copy').forEach(element => {
      element.classList.add('reveal'); revealObserver.observe(element);
    });
    document.body.classList.add('motion-ready');
  }
}
