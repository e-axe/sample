document.documentElement.classList.remove("no-js");
document.documentElement.classList.add("js");

// Font downloads must not block the first readable frame.
document.querySelectorAll('[data-font-stylesheet]').forEach((link) => { link.media = 'all'; });

const menuButton = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-menu]");
const menuRegions = document.querySelectorAll("main, .site-footer, .sample-bar, .brand, .skip-link");
let lastFocusedElement = null;
let menuIsMobile = window.innerWidth <= 767;

function setMenu(open, restoreFocus = true) {
  if (!menuButton || !mobileMenu) return;
  const isMobile = window.innerWidth <= 767;
  const wasOpen = document.body.classList.contains("menu-open");
  open = Boolean(open && isMobile);
  document.body.classList.toggle("menu-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  mobileMenu.setAttribute("aria-hidden", String(isMobile && !open));
  mobileMenu.inert = isMobile && !open;
  menuRegions.forEach((region) => {
    region.inert = open;
  });

  if (open && !wasOpen) {
    lastFocusedElement = document.activeElement;
    mobileMenu.querySelector("a")?.focus();
  } else if (!open && wasOpen && restoreFocus && isMobile) {
    (lastFocusedElement === menuButton ? lastFocusedElement : menuButton).focus();
  } else if (isMobile && !open && mobileMenu.contains(document.activeElement)) {
    // Resizing from desktop must not leave focus inside the hidden menu.
    menuButton.focus({ preventScroll: true });
  } else if (!isMobile && document.activeElement === menuButton) {
    mobileMenu.querySelector("a")?.focus({ preventScroll: true });
  }
}

menuButton?.addEventListener("click", () => {
  setMenu(!document.body.classList.contains("menu-open"));
});

mobileMenu?.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (event.target !== mobileMenu && !link) return;
  setMenu(false);
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const destination = new URL(link.href, window.location.href);
  if (destination.pathname !== window.location.pathname || destination.search !== window.location.search || !destination.hash) return;
  const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
  if (target) {
    if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }
});

document.addEventListener("keydown", (event) => {
  if (!document.body.classList.contains("menu-open")) return;
  if (event.key === "Escape") {
    event.preventDefault();
    setMenu(false);
  }
  if (event.key === "Tab") {
    const focusable = [menuButton, ...mobileMenu.querySelectorAll("a")].filter(Boolean);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

window.addEventListener("resize", () => {
  const isMobile = window.innerWidth <= 767;
  if (isMobile === menuIsMobile) return;
  menuIsMobile = isMobile;
  setMenu(false, false);
});
setMenu(false);

document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = new Date().getFullYear(); });

// Above-the-fold and keyboard-focused content stays readable without animation.
const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
if ("IntersectionObserver" in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -7%", threshold: 0 });
  // Read all geometry before changing styles to avoid repeated layout work.
  const belowFold = [...document.querySelectorAll(".reveal")]
    .filter((target) => target.getBoundingClientRect().top >= window.innerHeight);
  belowFold.forEach((target) => {
    target.classList.add("will-reveal");
    observer.observe(target);
  });
}

// Follow the real header height when fonts, text size or line wrapping change.
const siteHeader = document.querySelector('.site-header');
if (siteHeader && 'ResizeObserver' in window) {
  const headerObserver = new ResizeObserver(() => {
    document.documentElement.style.setProperty('--header-offset', `${siteHeader.getBoundingClientRect().height}px`);
  });
  headerObserver.observe(siteHeader);
}
