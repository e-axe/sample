(() => {
  const gallery = document.querySelector('[data-photo-gallery]');
  if (!gallery || typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
  const items = [...gallery.querySelectorAll('[data-gallery-item]')];
  if (!items.length) return;

  const viewer = document.createElement('dialog');
  viewer.className = 'photo-viewer';
  viewer.setAttribute('aria-labelledby', 'photo-viewer-title');
  viewer.innerHTML = `
    <header class="photo-viewer-header"><h2 id="photo-viewer-title"></h2><button class="photo-viewer-close" type="button" aria-label="写真を閉じる" autofocus><span aria-hidden="true">×</span></button></header>
    <div class="photo-viewer-stage"><img class="photo-viewer-image" alt="" decoding="async"><p class="photo-viewer-error" role="status" hidden>写真を読み込めませんでした。閉じてからもう一度お試しください。</p><button class="photo-viewer-prev" type="button" aria-label="前の写真"><span aria-hidden="true">‹</span></button><button class="photo-viewer-next" type="button" aria-label="次の写真"><span aria-hidden="true">›</span></button></div>
    <footer class="photo-viewer-footer"><p class="photo-viewer-caption"></p><p class="photo-viewer-counter" aria-live="polite" aria-atomic="true"></p></footer>`;
  document.body.append(viewer);
  const image = viewer.querySelector('.photo-viewer-image');
  const caption = viewer.querySelector('.photo-viewer-caption');
  const counter = viewer.querySelector('.photo-viewer-counter');
  const error = viewer.querySelector('.photo-viewer-error');
  const previous = viewer.querySelector('.photo-viewer-prev');
  const next = viewer.querySelector('.photo-viewer-next');
  const close = viewer.querySelector('.photo-viewer-close');
  const stage = viewer.querySelector('.photo-viewer-stage');
  viewer.querySelector('h2').textContent = `${gallery.querySelector('h1')?.textContent.trim() || 'タレント'} · 宣材写真`;
  previous.hidden = next.hidden = counter.hidden = items.length < 2;

  let index = 0;
  let opener;
  let scrollPosition = 0;
  let savedStyle;
  let touchStart;
  let backdropStart = false;
  const show = (requested) => {
    index = (requested + items.length) % items.length;
    const item = items[index];
    const text = item.dataset.galleryCaption || item.querySelector('img')?.alt || '宣材写真';
    error.hidden = true;
    image.hidden = false;
    image.alt = text;
    image.src = item.href;
    caption.textContent = text;
    counter.textContent = `${index + 1} / ${items.length}`;
  };
  const open = (requested, trigger) => {
    if (viewer.open) return;
    opener = trigger;
    scrollPosition = window.scrollY;
    savedStyle = document.body.getAttribute('style');
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const bodyPadding = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    show(requested);
    viewer.showModal();
    Object.assign(document.body.style, { position: 'fixed', top: `-${scrollPosition}px`, left: '0', right: '0', overflow: 'hidden', paddingRight: `${bodyPadding + scrollbarWidth}px` });
    close.focus({ preventScroll: true });
  };
  items.forEach((item, itemIndex) => {
    item.setAttribute('aria-haspopup', 'dialog');
    item.addEventListener('click', (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(itemIndex, item);
    });
  });
  gallery.querySelectorAll('[data-gallery-open]').forEach((trigger) => {
    trigger.hidden = false;
    trigger.textContent = items.length > 1 ? `写真を見る（${items.length}枚）` : '写真を拡大する';
    trigger.addEventListener('click', () => open(0, trigger));
  });
  gallery.classList.add('gallery-ready');
  close.addEventListener('click', () => viewer.close());
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  viewer.addEventListener('keydown', (event) => {
    if (items.length < 2 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    show(index + (event.key === 'ArrowRight' ? 1 : -1));
  });
  const outside = (event) => {
    const rect = viewer.getBoundingClientRect();
    return event.target === viewer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  };
  viewer.addEventListener('pointerdown', (event) => { backdropStart = outside(event); });
  viewer.addEventListener('click', (event) => { if (backdropStart && outside(event)) viewer.close(); });
  stage.addEventListener('touchstart', (event) => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : undefined;
  }, { passive: true });
  stage.addEventListener('touchend', (event) => {
    if (!touchStart || items.length < 2 || event.touches.length || !event.changedTouches[0]) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = undefined;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchStart = undefined; }, { passive: true });
  image.addEventListener('error', () => { if (viewer.open) { image.hidden = true; error.hidden = false; } });
  image.addEventListener('load', () => { if (viewer.open) { image.hidden = false; error.hidden = true; } });
  viewer.addEventListener('close', () => {
    if (savedStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', savedStyle);
    window.scrollTo({ top: scrollPosition, left: 0, behavior: 'instant' });
    opener?.focus({ preventScroll: true });
    image.removeAttribute('src');
    touchStart = undefined;
  });
})();
