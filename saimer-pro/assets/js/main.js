document.documentElement.classList.remove("no-js");
document.documentElement.classList.add("js");

const menuButton = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-menu]");
let lastFocusedElement = null;

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
  document.querySelectorAll("main, .site-footer, .sample-bar, .brand, .skip-link").forEach((region) => {
    region.inert = open;
  });

  if (open && !wasOpen) {
    lastFocusedElement = document.activeElement;
    mobileMenu.querySelector("a")?.focus();
  } else if (!open && wasOpen && restoreFocus && isMobile) {
    (lastFocusedElement === menuButton ? lastFocusedElement : menuButton).focus();
  }
}

menuButton?.addEventListener("click", () => {
  setMenu(!document.body.classList.contains("menu-open"));
});

mobileMenu?.addEventListener("click", (event) => {
  if (event.target === mobileMenu || event.target.closest("a")) setMenu(false);
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
  setMenu(window.innerWidth <= 767 && document.body.classList.contains("menu-open"), false);
});
setMenu(false);

const talentNames = Object.freeze({
  "ishihara-yueto": "石原 月斗",
  "nakayama-yui": "中山 結心",
  "tsukigata-hina": "月形 陽南",
  "takashima-hiroki": "髙島 大幹",
});
const inquiryTypes = Object.freeze({
  casting: { label: "出演・キャスティングのご相談", prefix: "出演依頼", opening: "出演・キャスティングについて相談いたします。", button: "メールで出演・キャスティングを相談する", fields: ["作品・企画の概要：", "出演予定日・期間：", "撮影・公演場所：", "ご希望の役柄や出演条件：", "ご予算・報酬条件（決まっている場合）："] },
  press: { label: "取材・媒体のご相談", prefix: "取材依頼", opening: "取材・媒体について相談いたします。", button: "メールで取材・媒体について相談する", fields: ["媒体名・企画の概要：", "取材の内容：", "取材希望日・場所：", "掲載・公開予定日："] },
  other: { label: "その他のお問い合わせ", prefix: "お問い合わせ", opening: "以下の内容についてお問い合わせいたします。", button: "メールで問い合わせる", fields: ["お問い合わせ内容："] },
});
const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const contactPanel = document.querySelector("[data-contact-email]");
// No fallback to the superseded recipient. Set only the approved new address.
const email = contactPanel?.dataset.contactEmail?.trim() || "";
const typeSelect = document.querySelector("[data-inquiry-type]");
const talentSelect = document.querySelector("[data-inquiry-talent]");
const copyButton = document.querySelector("[data-copy-email]");
const copyStatus = document.querySelector("[data-copy-status]");
const inquiryCopyButton = document.querySelector("[data-copy-inquiry]");
const inquiryCopyStatus = document.querySelector("[data-inquiry-copy-status]");
const inquiryBody = document.querySelector("[data-inquiry-body]");
const mailLinks = document.querySelectorAll("[data-mail-link]");
const subjectText = document.querySelector("[data-subject-text]");
const selectedTalentText = document.querySelector("[data-selected-talent]");
const profileReturn = document.querySelector("[data-talent-return]");
const profileReturnLink = document.querySelector("[data-talent-return-link]");
let inquiryText = "";

function updateInquiry() {
  if (!contactPanel) return;
  const type = owns(inquiryTypes, typeSelect?.value) ? typeSelect.value : "casting";
  const slug = owns(talentNames, talentSelect?.value) ? talentSelect.value : "";
  const name = slug ? talentNames[slug] : "";
  const inquiry = inquiryTypes[type];
  const subject = name
    ? `【${inquiry.prefix}】${name}様へのご相談｜S'aimerプロダクション`
    : `【S'aimerプロダクション】${inquiry.label}`;
  const body = [
    "S'aimerプロダクション ご担当者様", "", inquiry.opening, "",
    `対象タレント名：${name || "（指定がある場合）"}`,
    ...inquiry.fields, "ご担当者名・ご連絡先：", "",
    "※わかる範囲でご記入ください。すべての項目が揃っていなくてもご相談いただけます。",
  ].join("\r\n");
  inquiryText = `件名：${subject}\r\n\r\n${body}`;
  if (subjectText) subjectText.textContent = `件名：${subject}`;
  if (inquiryBody) inquiryBody.textContent = inquiryText;
  if (selectedTalentText) {
    selectedTalentText.hidden = !name;
    selectedTalentText.textContent = name ? `${name}への${inquiry.label}` : "";
  }
  if (profileReturn && profileReturnLink) {
    profileReturn.hidden = !slug;
    if (slug) profileReturnLink.href = `../talents/${slug}/`;
    else profileReturnLink.removeAttribute("href");
  }
  mailLinks.forEach((mailLink) => {
    mailLink.textContent = inquiry.button;
    if (email) {
      mailLink.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      mailLink.classList.remove("is-disabled");
      mailLink.removeAttribute("aria-disabled");
    }
  });
  if (email) {
    const address = document.querySelector("[data-email-address]");
    if (address) {
      address.textContent = email;
      address.hidden = false;
    }
    document.querySelectorAll("[data-email-pending]").forEach((node) => { node.hidden = true; });
    if (copyButton) copyButton.disabled = false;
  }
  if (inquiryCopyStatus) inquiryCopyStatus.textContent = "";
}

if (contactPanel) {
  const params = new URLSearchParams(window.location.search);
  if (typeSelect && owns(inquiryTypes, params.get("type"))) typeSelect.value = params.get("type");
  if (talentSelect && owns(talentNames, params.get("talent"))) talentSelect.value = params.get("talent");
  typeSelect?.addEventListener("change", updateInquiry);
  talentSelect?.addEventListener("change", updateInquiry);
  updateInquiry();
}

async function copyText(value, button, status, successMessage, failureMessage) {
  if (!value || !button) return;
  button.disabled = true;
  let copied = false;
  try {
    await navigator.clipboard.writeText(value);
    copied = true;
  } catch {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    try { copied = document.execCommand("copy"); }
    catch { copied = false; }
    finally { input.remove(); }
  }
  button.disabled = false;
  button.focus();
  if (status) status.textContent = copied ? successMessage : failureMessage;
}

copyButton?.addEventListener("click", () => {
  void copyText(email, copyButton, copyStatus, "メールアドレスをコピーしました。", "コピーできませんでした。表示されているメールアドレスを選択してコピーしてください。");
});
inquiryCopyButton?.addEventListener("click", () => {
  void copyText(inquiryText, inquiryCopyButton, inquiryCopyStatus, "ご相談用の文面をコピーしました。", "コピーできませんでした。表示されている文面を選択してコピーしてください。");
});

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
  document.querySelectorAll(".reveal").forEach((target) => {
    if (target.getBoundingClientRect().top < window.innerHeight) return;
    target.classList.add("will-reveal");
    observer.observe(target);
  });
}
