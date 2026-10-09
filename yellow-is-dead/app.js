(() => {
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
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      closeMenu();
      const section = document.querySelector(link.hash);
      section?.querySelector('h2')?.focus({preventScroll:true});
    }));
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
