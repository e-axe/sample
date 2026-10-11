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
  document.querySelectorAll("main, .site-footer, .sample-bar").forEach((region) => {
    region.inert = isMobile && open;
  });

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
// Set only the approved recipient on the contact page after it is received.
const contactPanel = document.querySelector("[data-contact-email]");
const email = contactPanel?.dataset.contactEmail.trim() || "";

const talentNames = Object.freeze({
  "ishihara-yueto": "石原 月斗",
  "nakayama-yui": "中山 結心",
  "tsukigata-hina": "月形 陽南",
  "takashima-hiroki": "髙島 大幹",
});

const params = new URLSearchParams(window.location.search);
const talentSlug = params.get("talent");
const selectedTalent = Object.hasOwn(talentNames, talentSlug)
  ? talentNames[talentSlug]
  : "";
const mailLinks = document.querySelectorAll("[data-mail-link]");
const subjectText = document.querySelector("[data-subject-text]");
const selectedTalentText = document.querySelector("[data-selected-talent]");

function castingSubject(name) {
  return name
    ? `【出演依頼】${name}様へのご相談｜S'aimerプロダクション`
    : "【S'aimerプロダクション】出演・キャスティングのご相談";
}

function castingBody(name) {
  return [
    "S'aimerプロダクション ご担当者様",
    "",
    "出演・キャスティングについて相談いたします。",
    "",
    `対象タレント名：${name || "（指定がある場合）"}`,
    "作品・企画の概要：",
    "出演予定日・期間：",
    "撮影・公演場所：",
    "ご希望の役柄や出演条件：",
    "ご予算・報酬条件（決まっている場合）：",
    "ご担当者名・ご連絡先：",
    "",
    "※わかる範囲でご記入ください。すべての項目が揃っていなくてもご相談いただけます。",
  ].join("\r\n");
}

if (contactPanel) {
  const subject = castingSubject(selectedTalent);
  if (subjectText) subjectText.textContent = `件名：${subject}`;
  if (selectedTalent && selectedTalentText) {
    selectedTalentText.hidden = false;
    selectedTalentText.textContent = `${selectedTalent}への出演・キャスティングのご相談`;
  }

  // An unset recipient must never fall back to the superseded address.
  if (email) {
    const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(castingBody(selectedTalent))}`;
    mailLinks.forEach((mailLink) => {
      mailLink.href = href;
      mailLink.classList.remove("is-disabled");
      mailLink.removeAttribute("aria-disabled");
    });
    const address = document.querySelector("[data-email-address]");
    if (address) {
      address.textContent = email;
      address.hidden = false;
    }
    document.querySelectorAll("[data-email-pending]").forEach((node) => {
      node.hidden = true;
    });
    if (copyButton) copyButton.disabled = false;
  }
}

copyButton?.addEventListener("click", async () => {
  if (!email) return;
  copyButton.disabled = true;
  let copied = false;
  try {
    await navigator.clipboard.writeText(email);
    copied = true;
  } catch {
    const input = document.createElement("textarea");
    input.value = email;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    } finally {
      input.remove();
    }
  }
  copyButton.disabled = false;
  copyButton.focus();
  if (copyStatus) {
    copyStatus.textContent = copied
      ? "メールアドレスをコピーしました。"
      : "コピーできませんでした。表示されているメールアドレスを選択してコピーしてください。";
  }
});

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
