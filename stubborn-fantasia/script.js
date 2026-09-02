document.documentElement.classList.add('js');

const header = document.querySelector('.site-header');
const progress = document.querySelector('.scroll-progress span');
const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('#main-nav');
const revealElements = document.querySelectorAll('.reveal');
const sectionLinks = [...navigation.querySelectorAll('a[href^="#"]')];
const observedSections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const closeMenu = () => {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.querySelector('.sr-only').textContent = 'メニューを開く';
  navigation.classList.remove('open');
  document.body.classList.remove('menu-open');
};

const updateScroll = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  progress.style.width = `${Math.min(Math.max(ratio, 0), 1) * 100}%`;
  header.classList.toggle('scrolled', window.scrollY > 24);
};

menuButton.addEventListener('click', () => {
  const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(willOpen));
  menuButton.querySelector('.sr-only').textContent = willOpen ? 'メニューを閉じる' : 'メニューを開く';
  navigation.classList.toggle('open', willOpen);
  document.body.classList.toggle('menu-open', willOpen);
});

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, {
  threshold: 0.08,
  rootMargin: '0px 0px -5% 0px'
});

revealElements.forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 3, 2) * 60}ms`;
  revealObserver.observe(element);
});

const sectionObserver = new IntersectionObserver((entries) => {
  const active = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (!active) return;

  sectionLinks.forEach((link) => {
    const isCurrent = link.getAttribute('href') === `#${active.target.id}`;
    if (isCurrent) {
      link.setAttribute('aria-current', 'true');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}, {
  rootMargin: '-25% 0px -60% 0px',
  threshold: [0, 0.15, 0.4]
});

observedSections.forEach((section) => sectionObserver.observe(section));

window.addEventListener('scroll', updateScroll, { passive: true });
window.addEventListener('resize', () => {
  if (window.innerWidth > 860) closeMenu();
});

updateScroll();
