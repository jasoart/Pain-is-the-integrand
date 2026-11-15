import { EXAMS, isExamKey, getCountdown, getExamEnd, createCalendar } from "./countdown.mjs";

const $ = id => document.getElementById(id);
const storageKey = "integrand.exam.116";
const zone = { timeZone: "Asia/Taipei" };
const weekday = new Intl.DateTimeFormat("zh-TW", { ...zone, weekday: "long" });
const clock = new Intl.DateTimeFormat("zh-TW", {
  ...zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
let selected = Date.now() >= getExamEnd(EXAMS.gsat) ? "ast" : "gsat";
let timer;
let toastTimer;

try {
  const saved = localStorage.getItem(storageKey);
  if (isExamKey(saved)) selected = saved;
} catch { /* The timer also works without browser storage. */ }

function setText(id, value) {
  const node = $(id);
  const text = String(value);
  if (node.textContent !== text) node.textContent = text;
}

function tick() {
  clearTimeout(timer);
  if (document.hidden) return;
  const exam = EXAMS[selected];
  const now = Date.now();
  const countdown = getCountdown(exam.start, now);
  setText("days", countdown.days);
  for (const unit of ["hours", "minutes", "seconds"]) {
    setText(unit, String(countdown[unit]).padStart(2, "0"));
  }
  if (countdown.started) {
    const untilEnd = getExamEnd(exam) - now;
    setText("count-caption", exam.subject + (untilEnd > 0 ? " 考試中" : " 已結束"));
    if (untilEnd > 0) timer = window.setTimeout(tick, untilEnd);
  } else {
    setText("count-caption", "距離 " + exam.subject + " 開考");
    timer = window.setTimeout(tick, 1000 - (now % 1000));
  }
}

function showExam(key) {
  selected = key;
  const exam = EXAMS[key];
  const start = Date.parse(exam.start);
  const date = exam.start.slice(0, 10);
  for (const id of Object.keys(EXAMS)) {
    $("btn-" + id).setAttribute("aria-pressed", String(id === key));
  }
  $("exam-date").dateTime = date;
  setText("exam-date", date.replaceAll("-", "."));
  setText("weekday", weekday.format(start));
  setText("exam-hours", clock.format(start) + "–" + clock.format(getExamEnd(exam)));
  setText("duration", exam.durationMinutes);
  tick();
}

for (const key of Object.keys(EXAMS)) {
  $("btn-" + key).addEventListener("click", () => {
    try { localStorage.setItem(storageKey, key); } catch { /* Optional preference. */ }
    showExam(key);
    setText("status", "");
  });
}

$("save-calendar").addEventListener("click", () => {
  const blob = new Blob([createCalendar(selected)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "116-" + selected + ".ics";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  clearTimeout(toastTimer);
  setText("status", "已建立" + EXAMS[selected].subject + "行事曆檔案");
  toastTimer = window.setTimeout(() => setText("status", ""), 3500);
});

document.addEventListener("visibilitychange", tick);
window.addEventListener("pageshow", tick);
window.addEventListener("pagehide", () => clearTimeout(timer));
showExam(selected);
document.querySelector(".exam-switch").hidden = false;
$("save-calendar").hidden = false;
