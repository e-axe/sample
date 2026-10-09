(() => {
  const header = document.querySelector('.site-header');
  if (header && 'ResizeObserver' in window) {
    const updateHeaderOffset = () => document.documentElement.style.setProperty('--header-offset', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    new ResizeObserver(updateHeaderOffset).observe(header);
    updateHeaderOffset();
  }
  const menu = document.querySelector('.mobile-menu');
  const summary = menu?.querySelector('summary');
  const closeMenu = (restore = false) => {
    if (!menu?.open) return;
    menu.open = false;
    if (restore) summary.focus();
  };
  if (menu) {
    summary.setAttribute('aria-expanded', String(menu.open));
    menu.addEventListener('toggle', () => {
      summary.setAttribute('aria-expanded', String(menu.open));
      document.body.classList.toggle('menu-open', menu.open);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu(true);
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target)) closeMenu();
    });
    matchMedia('(min-width:1080px)').addEventListener('change', event => {
      if (event.matches) closeMenu();
    });
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link?.hash) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    closeMenu();
    const focusTarget = target.matches('main') ? target : target.querySelector('h2, h3') || target;
    if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
    requestAnimationFrame(() => focusTarget.focus({preventScroll:true}));
  });
  document.querySelectorAll('img').forEach(img => {
    const fail = () => {
      img.classList.add('image-error');
      const placeholder = img.parentElement.querySelector('.image-fallback');
      if (placeholder) placeholder.hidden = false;
    };
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });
})();
