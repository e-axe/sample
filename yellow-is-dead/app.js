(() => {
  const header = document.querySelector('.site-header');
  if (header && 'ResizeObserver' in window) {
    const updateHeaderOffset = () => document.documentElement.style.setProperty('--header-offset', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    new ResizeObserver(updateHeaderOffset).observe(header);
    updateHeaderOffset();
  }
  const menu = document.querySelector('.mobile-menu');
  const summary = menu?.querySelector('summary');
  const syncMenu = () => {
    if (!menu || !summary) return;
    summary.setAttribute('aria-expanded', String(menu.open));
    document.body.classList.toggle('menu-open', menu.open);
  };
  const closeMenu = (restore = false) => {
    if (!menu?.open) return;
    menu.open = false;
    syncMenu();
    if (restore) summary.focus();
  };
  if (menu) {
    syncMenu();
    summary.addEventListener('click', event => {
      event.preventDefault();
      menu.open = !menu.open;
      syncMenu();
    });
    menu.addEventListener('toggle', syncMenu);
    menu.addEventListener('focusout', event => {
      if (event.relatedTarget && !menu.contains(event.relatedTarget)) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu(true);
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target)) closeMenu();
    });
    matchMedia('(min-width:1080px)').addEventListener('change', event => {
      if (!event.matches) return;
      const focusedLink = menu.contains(document.activeElement) ? document.activeElement.closest('a') : null;
      const wasFocused = menu.contains(document.activeElement);
      closeMenu();
      if (wasFocused) {
        const destination = focusedLink && document.querySelector(`.desktop-nav a[href="${focusedLink.getAttribute('href')}"]`);
        (destination || document.querySelector('.brand')).focus({preventScroll:true});
      }
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
    img.addEventListener('load', () => {
      img.classList.remove('image-error');
      const placeholder = img.parentElement.querySelector('.image-fallback');
      if (placeholder) placeholder.hidden = true;
    });
    if (img.complete && img.naturalWidth === 0) fail();
  });
})();
