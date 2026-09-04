document.documentElement.classList.remove("no-js");
document.documentElement.classList.add("js");

const menuButton = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-menu]");
let lastFocusedElement = null;

function setMenu(open) {
  if (!menuButton || !mobileMenu) return;
  const isMobile = window.innerWidth <= 767;
  document.body.classList.toggle("menu-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  mobileMenu.setAttribute("aria-hidden", String(isMobile && !open));

  if (open) {
    lastFocusedElement = document.activeElement;
    mobileMenu.querySelector("a")?.focus();
  } else if (lastFocusedElement === menuButton) {
    menuButton.focus();
  }
}

menuButton?.addEventListener("click", () => {
  setMenu(!document.body.classList.contains("menu-open"));
});

mobileMenu?.addEventListener("click", (event) => {
  if (event.target === mobileMenu || event.target.closest("a")) setMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
    setMenu(false);
  }

  if (event.key === "Tab" && document.body.classList.contains("menu-open")) {
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
  if (window.innerWidth > 767 && document.body.classList.contains("menu-open")) {
    setMenu(false);
  } else if (mobileMenu) {
    mobileMenu.setAttribute(
      "aria-hidden",
      String(window.innerWidth <= 767 && !document.body.classList.contains("menu-open")),
    );
  }
});

setMenu(false);

const copyButton = document.querySelector("[data-copy-email]");
const copyStatus = document.querySelector("[data-copy-status]");
const email = "saimer.pro.onishi@outlook.jp";

copyButton?.addEventListener("click", async () => {
  const original = copyButton.textContent;
  try {
    await navigator.clipboard.writeText(email);
    copyButton.textContent = "コピーしました";
    if (copyStatus) copyStatus.textContent = "メールアドレスをコピーしました。";
  } catch {
    const input = document.createElement("textarea");
    input.value = email;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
    copyButton.textContent = "コピーしました";
    if (copyStatus) copyStatus.textContent = "メールアドレスをコピーしました。";
  }

  window.setTimeout(() => {
    copyButton.textContent = original;
    if (copyStatus) copyStatus.textContent = "";
  }, 2000);
});

const talentNames = {
  "ishihara-yueto": "石原 月斗",
  "nakayama-yui": "中山 結心",
  "tsukigata-hina": "月形 陽奈",
  "takashima-hiroki": "髙島 大幹",
};

const params = new URLSearchParams(window.location.search);
const selectedTalent = talentNames[params.get("talent")];
const mailLinks = document.querySelectorAll("[data-mail-link]");
const subjectText = document.querySelector("[data-subject-text]");

if (mailLinks.length) {
  const subject = selectedTalent
    ? `【出演・キャスティングのご相談】${selectedTalent}について`
    : "【S'aimerプロダクション】お問い合わせ";
  mailLinks.forEach((mailLink) => {
    mailLink.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  });
  if (selectedTalent && subjectText) {
    subjectText.textContent = `${selectedTalent}さんへのご依頼として件名を設定します。`;
  }
}

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const revealTargets = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -7%", threshold: 0.08 },
  );
  revealTargets.forEach((target) => observer.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}
