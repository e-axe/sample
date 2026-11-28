const nav = document.getElementById('site-nav');
const menu = document.querySelector('.menu-toggle');
const mobileCta = document.querySelector('.mobile-cta');
const heroButton = document.querySelector('.hero-cta');
const schedule = document.getElementById('schedule');
const header = document.querySelector('.site-header');
const compact = window.matchMedia('(max-width: 1000px)');
const sessions = [...document.querySelectorAll('.session')];
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

nav.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || menu.getAttribute('aria-expanded') !== 'true') return;
  toggleMenu(false);
  const section = document.getElementById(link.hash.slice(1));
  const heading = section?.querySelector('h2');
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
});

function openLinkedDetails(id, focus) {
  const target = document.getElementById(id);
  if (!target?.matches('details.session, details.performer')) return;
  if (target.classList.contains('session')) {
    for (const session of sessions) if (session !== target) session.open = false;
  }
  target.open = true;
  const summary = target.querySelector('summary');
  if (focus) summary.focus({ preventScroll: true });
  summary.scrollIntoView({ block: 'start' });
}

function syncHash() {
  openLinkedDetails(location.hash.slice(1), false);
}

window.addEventListener('hashchange', syncHash);
if (location.hash) requestAnimationFrame(syncHash);

document.addEventListener('click', (event) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href^="#session-"], a[href^="#reading-"]');
  if (!link || !document.getElementById(link.hash.slice(1))) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  openLinkedDetails(link.hash.slice(1), true);
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
  mobileCta.hidden = !compact.matches
    || heroButton.getBoundingClientRect().bottom > headerBottom
    || schedule.getBoundingClientRect().top < window.innerHeight;
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
