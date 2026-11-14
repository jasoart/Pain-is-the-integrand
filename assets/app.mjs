import { EXAMS, isExamKey, getCountdown, dayPhrase, createCalendar } from "./countdown.mjs";

const $ = id => document.getElementById(id);
const storageKey = "integrand.exam.116";
let selected = "gsat";
let timer;
let toastTimer;

try {
  const saved = localStorage.getItem(storageKey);
  if (isExamKey(saved)) selected = saved;
} catch { /* Storage may be unavailable in private or embedded browsing. */ }

// Avoid rebuilding unchanged text nodes every second.
function setText(id, value) {
  const node = $(id);
  const text = String(value);
  if (node.textContent !== text) node.textContent = text;
}

function render() {
  const now = Date.now();
  const countdown = getCountdown(EXAMS[selected].start, now);
  setText("days", countdown.days.toLocaleString("en-US"));
  for (const unit of ["hours", "minutes", "seconds"]) {
    setText(unit, String(countdown[unit]).padStart(2, "0"));
  }
  setText("count-caption", countdown.started ? "此科考試已開考，祝你穩定發揮。" : EXAMS[selected].caption);
  const phrase = dayPhrase(getCountdown(EXAMS.gsat.start, now));
  setText("day-phrase", phrase);
  setText("closing-day-phrase", phrase);
}

function tick() {
  clearTimeout(timer);
  if (document.hidden) return;
  render();
  // Derive from the wall clock each tick so suspension never accumulates drift.
  timer = window.setTimeout(tick, 1000 - Date.now() % 1000 + 10);
}

function feedback(message) {
  clearTimeout(toastTimer);
  setText("status", message);
  $("status").classList.add("visible");
  toastTimer = window.setTimeout(() => $("status").classList.remove("visible"), 3500);
}

function choose(key, announce = false) {
  if (!isExamKey(key)) return;
  selected = key;
  for (const id of Object.keys(EXAMS)) $("btn-" + id).setAttribute("aria-pressed", String(id === key));
  const exam = EXAMS[key];
  setText("exam-name", exam.name);
  setText("exam-date", exam.dateLabel);
  $("exam-date").dateTime = exam.start;
  setText("exam-period", exam.period);
  try { localStorage.setItem(storageKey, key); } catch { /* Nonessential preference. */ }
  render();
  if (announce) feedback(`已切換至${exam.name}倒數`);
}

for (const key of Object.keys(EXAMS)) $("btn-" + key).addEventListener("click", () => choose(key, true));

function legacyCopy(text) {
  const focused = document.activeElement;
  const selection = window.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : [];
  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true;
  field.style.cssText = "position:fixed;top:0;left:-9999px;font-size:16px";
  document.body.append(field);
  let copied = false;
  try {
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, text.length);
    copied = document.execCommand("copy");
  } catch { /* A manual copy dialog is the final fallback. */ }
  finally {
    field.remove();
    if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
    if (selection) {
      selection.removeAllRanges();
      for (const range of ranges) selection.addRange(range);
    }
  }
  return copied;
}

async function copy(text, label, button) {
  button.disabled = true;
  let copied = false;
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      copied = true;
    }
  } catch { /* Try the older copy API on browsers that deny clipboard access. */ }
  try {
    if (!copied) copied = legacyCopy(text);
    if (copied) feedback(`${label}已複製，準備好就開始吧。`);
    else {
      $("manual-copy").value = text;
      $("copy-dialog").showModal();
      $("manual-copy").focus();
      $("manual-copy").select();
    }
  } finally { button.disabled = false; }
}

$("copy-prompt").addEventListener("click", event => copy($("prompt-example").textContent.trim(), "提問範例", event.currentTarget));
$("copy-name").addEventListener("click", event => copy("Pain is the Integrand", "外掛名稱", event.currentTarget));
$("copy-letter").addEventListener("click", event => {
  const letter = Array.from($("thank-you-letter").children)
    .filter(node => node.matches("p, ol, .signature"))
    .map(node => node.innerText.trim());
  const notice = [
    "【服務方式更新】",
    ...Array.from(document.querySelectorAll(".service-lead > p"), node => node.innerText.trim()),
    "使用方式：開啟 ChatGPT → 輸入 @ → 選取 Pain is the Integrand → 輸入題目或上傳照片。",
    "若找不到外掛，請到 Plugins 搜尋並安裝；仍找不到時，請向建立者確認分享權限。",
    "官方說明：https://help.openai.com/en/articles/20001256-plugins-in-chatgpt",
  ];
  copy(["給一路相信我們的你。", ...letter, ...notice].join("\n\n"), "感謝函", event.currentTarget);
});
$("close-copy-dialog").addEventListener("click", () => $("copy-dialog").close());
$("print-page").addEventListener("click", () => window.print());

$("save-calendar").addEventListener("click", () => {
  const blob = new Blob([createCalendar(selected)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `116-${selected}.ics`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback(`已準備${EXAMS[selected].name}行事曆，請開啟下載的檔案匯入。`);
});

document.addEventListener("visibilitychange", tick);
window.addEventListener("pageshow", tick);
window.addEventListener("pagehide", () => clearTimeout(timer));
choose(selected);
tick();
