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
      const placeholder = (img.closest('.cast-photo') || img.parentElement).querySelector('.image-fallback');
      if (placeholder) placeholder.hidden = false;
    };
    img.addEventListener('error', fail);
    img.addEventListener('load', () => {
      img.classList.remove('image-error');
      const placeholder = (img.closest('.cast-photo') || img.parentElement).querySelector('.image-fallback');
      if (placeholder) placeholder.hidden = true;
    });
    if (img.getAttribute('src') && img.complete && img.naturalWidth === 0) fail();
  });
  const viewer = document.querySelector('.flyer-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;
  const stage = viewer.querySelector('.viewer-stage');
  const canvas = viewer.querySelector('.viewer-canvas');
  const image = viewer.querySelector('.viewer-image');
  const message = viewer.querySelector('.viewer-message');
  const status = message.querySelector('[role="status"]');
  const retry = viewer.querySelector('.viewer-retry');
  const zoomButton = viewer.querySelector('.viewer-zoom');
  const sides = [...viewer.querySelectorAll('.viewer-side')];
  const triggers = [...document.querySelectorAll('[data-flyer]')];
  const flyers = new Map(triggers.map(link => [link.dataset.flyer, {
    url: link.href, label: link.dataset.label,
    alt: document.querySelector(`.flyer-image-link[data-flyer="${link.dataset.flyer}"] img`).alt
  }]));
  let activeSide, opener, scrollY = 0, zoomed = false, ready = false;
  let drag = null, draggedClick = null;
  const finishDrag = (blockClick = false) => {
    if (!drag) return;
    const {pointerId, moved} = drag;
    drag = null;
    draggedClick = blockClick && moved ? pointerId : null;
    stage.classList.remove('is-dragging');
    if (stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
  };
  const resetDrag = () => { finishDrag(); draggedClick = null; };
  // Mouse-only drag-to-pan; touch keeps the browser's native scrolling.
  stage.addEventListener('pointerdown', event => {
    resetDrag();
    if (event.pointerType !== 'mouse' || event.button !== 0 || !zoomed || !ready) return;
    const bounds = stage.getBoundingClientRect();
    // Leave the native scrollbar tracks available for mouse interaction.
    if (event.clientX >= bounds.left + stage.clientWidth || event.clientY >= bounds.top + stage.clientHeight) return;
    drag = {pointerId: event.pointerId, x: event.clientX, y: event.clientY,
      left: stage.scrollLeft, top: stage.scrollTop, moved: false};
  });
  window.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!(event.buttons & 1)) { finishDrag(true); return; }
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 5) return;
      drag.moved = true;
      stage.setPointerCapture(event.pointerId);
      stage.classList.add('is-dragging');
    }
    event.preventDefault();
    stage.scrollLeft = drag.left - dx;
    stage.scrollTop = drag.top - dy;
  });
  window.addEventListener('pointerup', event => {
    if (drag?.pointerId === event.pointerId) finishDrag(true);
  });
  window.addEventListener('pointercancel', event => {
    if (drag?.pointerId === event.pointerId) resetDrag();
  });
  stage.addEventListener('lostpointercapture', event => {
    if (drag?.pointerId === event.pointerId) finishDrag(true);
  });
  window.addEventListener('blur', () => finishDrag(true));
  stage.addEventListener('click', event => {
    if (draggedClick !== null && event.detail > 0 && event.pointerId === draggedClick) {
      event.preventDefault();
      event.stopPropagation();
    }
    draggedClick = null;
  }, true);
  image.addEventListener('dragstart', event => event.preventDefault());
  const layout = (center = false) => {
    if (!viewer.open || !ready) return;
    // Scrollbars change clientWidth/clientHeight. Use the stable outer frame
    // so fitting an image cannot trigger a second zoom calculation.
    stage.classList.toggle('is-zoomed', zoomed);
    const viewport = stage.getBoundingClientRect();
    const ratio = image.naturalWidth / image.naturalHeight;
    const fittedWidth = Math.min(image.naturalWidth, Math.max(1, viewport.width - 32), Math.max(1, viewport.height - 32) * ratio);
    const width = Math.min(image.naturalWidth, fittedWidth * (zoomed ? 3 : 1));
    image.style.width = `${width}px`;
    // CSS min-size fills the remaining viewport without forcing a horizontal
    // scrollbar when only the image height exceeds the frame.
    canvas.style.width = zoomed ? `${width + 32}px` : '100%';
    canvas.style.height = zoomed ? `${width / ratio + 32}px` : '100%';
    if (center) {
      stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
      stage.scrollTop = (stage.scrollHeight - stage.clientHeight) / 2;
    }
  };
  const setZoom = value => {
    resetDrag();
    zoomed = value;
    zoomButton.setAttribute('aria-pressed', String(value));
    zoomButton.querySelector('.viewer-zoom-label').textContent = value ? '全体を表示' : '拡大する';
    layout(true);
  };
  const loadSide = side => {
    const flyer = flyers.get(side);
    if (!flyer) return;
    activeSide = side;
    ready = false;
    zoomButton.disabled = true;
    setZoom(false);
    stage.scrollTop = stage.scrollLeft = 0;
    canvas.style.width = canvas.style.height = '100%';
    image.hidden = true;
    image.classList.remove('image-error');
    image.alt = flyer.alt;
    message.hidden = false;
    status.textContent = `${flyer.label}を読み込んでいます。`;
    retry.hidden = true;
    sides.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.side === side)));
    image.src = flyer.url;
  };
  const imageFailed = () => {
    if (!viewer.open) return;
    ready = false;
    image.hidden = true;
    zoomButton.disabled = true;
    message.hidden = false;
    status.textContent = '画像を読み込めませんでした。';
    retry.hidden = false;
  };
  image.addEventListener('error', imageFailed);
  image.addEventListener('load', async () => {
    const loadedUrl = image.src;
    try { await image.decode(); } catch { if (image.src === loadedUrl) imageFailed(); return; }
    if (!viewer.open || image.src !== loadedUrl) return;
    ready = true;
    image.hidden = false;
    message.hidden = true;
    zoomButton.disabled = false;
    layout(true);
  });
  triggers.forEach(link => {
    link.setAttribute('role', 'button');
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', viewer.id);
    link.setAttribute('aria-label', `フライヤー${link.dataset.label}を拡大表示`);
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      scrollY = window.scrollY;
      document.body.style.setProperty('--viewer-scroll-top', `${-scrollY}px`);
      document.body.classList.add('flyer-viewer-open');
      viewer.showModal();
      loadSide(link.dataset.flyer);
    });
    link.addEventListener('keydown', event => {
      if (event.key === ' ') { event.preventDefault(); link.click(); }
    });
  });
  sides.forEach(button => button.addEventListener('click', () => {
    if (button.dataset.side !== activeSide) loadSide(button.dataset.side);
  }));
  retry.addEventListener('click', () => loadSide(activeSide));
  zoomButton.addEventListener('click', () => setZoom(!zoomed));
  image.addEventListener('click', () => { if (ready) setZoom(!zoomed); });
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...viewer.querySelectorAll('button:not(:disabled), [tabindex="0"]')].filter(element => element.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || !viewer.contains(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !viewer.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  });
  let backdropPress = false;
  viewer.addEventListener('pointerdown', event => { backdropPress = event.target === viewer; });
  viewer.addEventListener('click', event => {
    if (backdropPress && event.target === viewer) viewer.close();
    backdropPress = false;
  });
  viewer.addEventListener('close', () => {
    resetDrag();
    ready = false;
    image.hidden = true;
    image.removeAttribute('src');
    document.body.classList.remove('flyer-viewer-open');
    document.body.style.removeProperty('--viewer-scroll-top');
    window.scrollTo({top: scrollY, behavior: 'instant'});
    opener?.focus({preventScroll: true});
  });
  new ResizeObserver(() => layout()).observe(stage, {box: 'border-box'});
})();
