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
const toggleAllCasts = document.getElementById('toggle-all-casts');
const sameRole = document.getElementById('same-role');
const sameRoleLabel = document.getElementById('same-role-label');
const sameRoleList = document.getElementById('same-role-list');
const showButtons = [...document.querySelectorAll('[data-show]')];
const peopleByShow = new Map(data.shows.map(show => [show.id, data.cast.filter(person => person.shows.includes(show.id))]));
const nav = document.getElementById('navigation');
const menu = document.querySelector('.menu-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const label = show => `12/${show.day}（${show.weekday}）${show.time}`;
const castDays = person => person.shows.length === 9 ? '全9公演' : [...new Set(person.shows.map(id => data.shows.find(s => s.id === id).day))].map((v, i) => i === 0 ? `12/${v}` : v).join('・');
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

function updateToggleAllLabel() {
  const allDetails = [...list.querySelectorAll('details')];
  if (allDetails.length <= 1) {
    toggleAllCasts.hidden = true;
    return;
  }
  toggleAllCasts.hidden = false;
  const allOpen = allDetails.every(d => d.open);
  toggleAllCasts.textContent = allOpen ? '全公演の出演者をたたむ' : '全公演の出演者を開く';
}

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
  selectionSummary.textContent = `${cast ? `出演者：${cast.name}（${cast.role} 役）` : '出演者：指定なし'}\n${show ? `日時：${label(show)} 開演` : '日時：指定なし（すべての公演）'}`;
  clearShow.hidden = !selectedShow;
  clearCast.hidden = !cast;
  const peers = cast ? data.cast.filter(person => person.role === cast.role && person.id !== cast.id) : [];
  sameRole.hidden = peers.length === 0;
  sameRoleList.replaceChildren();
  if (peers.length > 0) {
    sameRoleLabel.textContent = `同じ役（${cast.role} 役）の他公演キャスト`;
    peers.forEach(peer => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'same-role-chip';
      chip.dataset.cast = peer.id;
      chip.setAttribute('aria-label', `${peer.name}（${castDays(peer)}）の出演回を見る`);
      const nameSpan = document.createElement('span');
      nameSpan.textContent = peer.name;
      const daysSmall = document.createElement('small');
      daysSmall.textContent = castDays(peer);
      chip.append(nameSpan, daysSmall);
      sameRoleList.append(chip);
    });
  }
  // With a cast filter, let visitors return to all of that person's shows without leaving the results.
  resultClearShow.hidden = !(cast && selectedShow);
  if (cast) resultClearShow.textContent = `日時を解除（全${cast.shows.length}公演を表示）`;
  results.hidden = !cast && !selectedShow;
  list.replaceChildren();
  if (results.hidden) {
    toggleAllCasts.hidden = true;
    return;
  }
  heading.textContent = cast ? `${cast.name}さんの出演公演` : '選択した公演の出演者';
  status.textContent = cast
    ? `${shows.length}公演${selectedShow ? 'を選択中' : 'に出演'}。日時をご確認ください（出演者名から出演回を表示できます）。`
    : 'この公演に出演するキャストをご確認ください（出演者名から出演回を表示できます）。';
  const fragment = document.createDocumentFragment();
  shows.forEach((show, index) => {
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
    details.open = Boolean(selectedShow || index === 0);
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
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'result-cast-btn';
        btn.dataset.resultCast = person.id;
        btn.setAttribute('aria-label', `${person.name}（${person.role} 役）の出演回を見る`);
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
        btn.append(picture, info);
        item.append(btn);
        names.append(item);
      });
      details.append(names);
    }
    details.addEventListener('toggle', () => {
      populate();
      updateToggleAllLabel();
    });
    populate();
    details.prepend(summary);
    article.append(details);
    fragment.append(article);
  });
  list.append(fragment);
  updateToggleAllLabel();
}

function selectCast(castId, scrollTarget = null) {
  filter.value = castId;
  selectedShow = null;
  render();
  if (scrollTarget === 'finder') {
    filter.focus({ preventScroll: true });
    document.getElementById('cast-finder').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  } else if (scrollTarget === 'results' && !results.hidden) {
    heading.focus({ preventScroll: true });
    results.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  }
}

filter.addEventListener('change', () => { selectedShow = null; render(); });
document.querySelector('.cast-grid').addEventListener('click', event => {
  const link = event.target.closest('[data-cast]');
  if (!link) return;
  event.preventDefault();
  selectCast(link.dataset.cast, 'finder');
});
sameRoleList.addEventListener('click', event => {
  const chip = event.target.closest('[data-cast]');
  if (chip) selectCast(chip.dataset.cast, 'results');
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
  const showButton = event.target.closest('[data-select-show]');
  if (showButton) {
    selectShow(Number(showButton.dataset.selectShow), true);
    return;
  }
  const castButton = event.target.closest('[data-result-cast]');
  if (castButton) selectCast(castButton.dataset.resultCast, 'results');
});
toggleAllCasts.addEventListener('click', () => {
  const allDetails = [...list.querySelectorAll('details')];
  const shouldOpen = !allDetails.every(d => d.open);
  allDetails.forEach(d => { d.open = shouldOpen; });
  updateToggleAllLabel();
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
const countdownElements = [...document.querySelectorAll('[data-sale-countdown]')];
function formatCountdown(ms) {
  if (ms <= 0) return '';
  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `発売開始まで あと${days}日${hours}時間`;
  if (hours > 0) return `発売開始まで あと${hours}時間${minutes}分`;
  return `発売開始まで あと${Math.max(minutes, 1)}分`;
}
function updateSale() {
  clearTimeout(saleTimer);
  const now = Date.now();
  const state = getSaleState(now, data.saleAt, data.endsAt);
  const upcoming = state === 'upcoming';
  const ended = state === 'ended';
  if (state !== lastSaleState) {
    lastSaleState = state;
    document.body.dataset.saleState = state;
    document.querySelectorAll('[data-sale-link]').forEach(link => {
      link.removeAttribute('aria-disabled');
      link.href = data.ticketUrl;
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
  const saleTime = Date.parse(data.saleAt);
  const countdownText = upcoming ? formatCountdown(saleTime - now) : '';
  countdownElements.forEach(el => {
    el.hidden = !countdownText;
    el.textContent = countdownText;
  });
  if (state !== 'ended') {
    const next = upcoming ? Math.min(saleTime - now, 60000) : Date.parse(data.endsAt) - now;
    saleTimer = setTimeout(updateSale, Math.min(Math.max(next, 1000), 86400000));
  }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateSale(); });
window.addEventListener('pageshow', () => { render(); updateSale(); });
updateSale();

const mapFrame = document.querySelector('.theatre-map[data-map-src]');
function loadMap() {
  if (!mapFrame || !mapFrame.dataset.mapSrc) return;
  mapFrame.src = mapFrame.dataset.mapSrc;
  delete mapFrame.dataset.mapSrc;
}
document.querySelector('nav a[href="#venue"]')?.addEventListener('click', loadMap, { once: true });

if ('IntersectionObserver' in window) {
  if (mapFrame) {
    const mapObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        loadMap();
        mapObserver.disconnect();
      }
    }, { rootMargin: '350px 0px' });
    mapObserver.observe(mapFrame);
  }
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
} else {
  loadMap();
}

const scheduleTrigger = document.getElementById('cast-schedule-open');
const scheduleDialog = document.getElementById('cast-schedule-dialog');
const scheduleClose = document.getElementById('cast-schedule-close');
const scheduleImage = scheduleDialog?.querySelector('.lightbox-image');

if (scheduleTrigger && scheduleDialog) {
  const openLightbox = () => {
    if (typeof scheduleDialog.showModal === 'function') {
      scheduleDialog.showModal();
    } else {
      scheduleDialog.setAttribute('open', '');
    }
    document.body.classList.add('lightbox-open');
  };

  const closeLightbox = () => {
    if (scheduleDialog.hasAttribute('open')) {
      if (typeof scheduleDialog.close === 'function') {
        scheduleDialog.close();
      } else {
        scheduleDialog.removeAttribute('open');
      }
    }
    document.body.classList.remove('lightbox-open');
    scheduleImage?.classList.remove('is-zoomed');
  };

  scheduleTrigger.addEventListener('click', openLightbox);
  scheduleClose?.addEventListener('click', closeLightbox);

  let pressedOutside = false;
  scheduleDialog.addEventListener('pointerdown', (e) => {
    pressedOutside = !e.target.closest('.lightbox-image') && !e.target.closest('.lightbox-close');
  });
  scheduleDialog.addEventListener('pointerup', (e) => {
    if (pressedOutside && !e.target.closest('.lightbox-image') && !e.target.closest('.lightbox-close')) {
      closeLightbox();
    }
    pressedOutside = false;
  });

  scheduleDialog.addEventListener('click', (e) => {
    if (e.target.closest('#cast-schedule-close')) {
      closeLightbox();
      return;
    }
    if (!e.target.closest('.lightbox-image')) {
      closeLightbox();
    }
  });

  scheduleImage?.addEventListener('click', (e) => {
    e.stopPropagation();
    scheduleImage.classList.toggle('is-zoomed');
  });

  scheduleDialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeLightbox();
  });
  scheduleDialog.addEventListener('close', () => {
    document.body.classList.remove('lightbox-open');
    scheduleImage?.classList.remove('is-zoomed');
  });
  scheduleDialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
    }
  });
}
