const nav = document.getElementById('site-nav');
const menu = document.querySelector('.menu-toggle');
const mobileCta = document.querySelector('.mobile-cta');
const heroButton = document.querySelector('.hero-cta');
const booking = document.getElementById('booking');
const closingCta = document.querySelector('.invitation-cta');
const header = document.querySelector('.site-header');
const compact = window.matchMedia('(max-width: 1000px)');
const sessions = [...document.querySelectorAll('.session')];
const scheduleDays = [...document.querySelectorAll('.day-row')];
const scheduleList = document.getElementById('schedule-list');
const performerFilter = document.getElementById('schedule-performer');
const filterResult = document.querySelector('.schedule-results');
const flyerDialog = document.querySelector('.flyer-dialog');

if (typeof flyerDialog?.showModal === 'function') {
  for (const link of document.querySelectorAll('[data-flyer-open]')) {
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      flyerDialog.showModal();
    });
  }
  flyerDialog.addEventListener('click', (event) => {
    if (event.target === flyerDialog) flyerDialog.close();
  });
}

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

function focusSection(section) {
  const heading = section.matches('#booking') ? section : section.querySelector('h2') ?? section;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

nav.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || menu.getAttribute('aria-expanded') !== 'true') return;
  toggleMenu(false);
  const section = document.getElementById(link.hash.slice(1));
  if (section) focusSection(section);
});

function updateScheduleFilter() {
  const selected = performerFilter.selectedOptions[0];
  const matching = selected?.value ? selected.dataset.sessions.split(' ').filter(Boolean) : null;
  for (const session of sessions) {
    session.hidden = Boolean(matching && !matching.includes(session.id));
    if (session.hidden) session.open = false;
  }
  for (const day of scheduleDays) day.hidden = day.querySelector('.session:not([hidden])') === null;
  scheduleList.hidden = matching?.length === 0;
  filterResult.textContent = !matching ? '' : matching.length
    ? `${matching.length}ステージを表示中`
    : '出演回は後日発表します。';
}

function readScheduleSelection() {
  if (!performerFilter) return;
  performerFilter.value = new URLSearchParams(location.search).get('performer') ?? '';
  if (performerFilter.selectedIndex === -1) performerFilter.value = '';
  updateScheduleFilter();
}

function writeScheduleSelection(performer, hash, replace = false) {
  const url = new URL(location.href);
  if (performer) url.searchParams.set('performer', performer);
  else url.searchParams.delete('performer');
  url.hash = hash;
  if (url.href !== location.href) {
    if (replace) history.replaceState(null, '', url);
    else history.pushState(null, '', url);
  }
}

if (performerFilter) {
  performerFilter.closest('.schedule-filter').hidden = false;
  performerFilter.addEventListener('change', () => {
    writeScheduleSelection(performerFilter.value, '#schedule', true);
    updateScheduleFilter();
  });
  readScheduleSelection();
}

function goToCastOrSession(id, focus) {
  const target = document.getElementById(id);
  let destination = target;
  if (target?.matches('details.session')) {
    if (target.hidden && performerFilter) {
      performerFilter.value = '';
      writeScheduleSelection('', location.hash, true);
      updateScheduleFilter();
    }
    for (const session of sessions) if (session !== target) session.open = false;
    target.open = true;
    destination = target.querySelector('summary');
  } else if (!target?.matches('.performer')) {
    return;
  }
  if (focus) destination.focus({ preventScroll: true });
  destination.scrollIntoView({ block: 'start' });
}

function syncHash() {
  goToCastOrSession(location.hash.slice(1), false);
}

window.addEventListener('hashchange', syncHash);
window.addEventListener('popstate', () => {
  readScheduleSelection();
  syncHash();
});
if (location.hash) requestAnimationFrame(syncHash);

if ('IntersectionObserver' in window && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const materialize = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.parentElement.classList.add('ideal-materializing');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '-72px 0px -78px', threshold: .5 });
  for (const connection of document.querySelectorAll('.ideal-connection')) materialize.observe(connection);
}

document.addEventListener('click', (event) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a.cast-portrait-link, a[href^="#"]');
  const target = link && document.getElementById(link.hash.slice(1));
  if (!target) return;
  if (link.matches('.cast-portrait-link') && performerFilter) {
    event.preventDefault();
    const performer = new URL(link.href).searchParams.get('performer');
    writeScheduleSelection(performer, link.hash);
    readScheduleSelection();
    focusSection(target);
    target.scrollIntoView({ block: 'start' });
    return;
  }
  if (link.matches('.hero-cta, .header-cta, .invitation-cta, .cast-schedule-link, .booking-shortcuts a, .mobile-cta a')) {
    requestAnimationFrame(() => focusSection(target));
    return;
  }
  if (!target.matches('details.session, .performer')) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  goToCastOrSession(link.hash.slice(1), true);
});

for (const session of sessions) {
  session.querySelector('summary').addEventListener('click', () => {
    const hash = session.open ? '#schedule' : '#' + session.id;
    if (!session.open) {
      for (const other of sessions) if (other !== session) other.open = false;
    }
    if (location.hash !== hash) history.pushState(null, '', hash);
  });
}

let framePending = false;
function updateMobileCta() {
  framePending = false;
  const headerBottom = header.getBoundingClientRect().bottom;
  const bookingBounds = booking.getBoundingClientRect();
  const closingBounds = closingCta.getBoundingClientRect();
  const readingBooking = bookingBounds.top <= headerBottom + 20 && bookingBounds.bottom > headerBottom + 110;
  const closingVisible = closingBounds.top < window.innerHeight - 60 && closingBounds.bottom > headerBottom;
  mobileCta.hidden = !compact.matches
    || heroButton.getBoundingClientRect().bottom > headerBottom
    || readingBooking
    || closingVisible;
}

function queueMobileCta() {
  if (!framePending) {
    framePending = true;
    requestAnimationFrame(updateMobileCta);
  }
}

window.addEventListener('scroll', queueMobileCta, { passive: true });
window.addEventListener('resize', queueMobileCta);
document.addEventListener('toggle', queueMobileCta, true);
queueMobileCta();
