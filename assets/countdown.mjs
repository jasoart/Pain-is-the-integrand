// All exam instants have an explicit UTC+8 offset, independent of the device zone.
// Source: 大考中心《116 學年度考試簡章》, pp. 3 and 9 (PDF pages 9 and 14).
export const EXAMS = Object.freeze({
  gsat: Object.freeze({
    name: "116 學測・數學 A",
    start: "2027-01-22T09:20:00+08:00",
    durationMinutes: 100,
    subject: "學測數學 A",
  }),
  ast: Object.freeze({
    name: "116 分科測驗・數學甲",
    start: "2027-07-10T14:00:00+08:00",
    durationMinutes: 80,
    subject: "分科數學甲",
  }),
});

export const isExamKey = key => Object.hasOwn(EXAMS, key);

export function getExamEnd(exam) {
  return Date.parse(exam.start) + exam.durationMinutes * 60_000;
}

export function getCountdown(target, now = Date.now()) {
  const timestamp = typeof target === "number" ? target : Date.parse(target);
  if (!Number.isFinite(timestamp) || !Number.isFinite(now)) {
    throw new TypeError("Countdown requires valid timestamps");
  }
  const totalSeconds = Math.max(0, Math.ceil((timestamp - now) / 1000));
  return {
    totalSeconds,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor(totalSeconds % 86400 / 3600),
    minutes: Math.floor(totalSeconds % 3600 / 60),
    seconds: totalSeconds % 60,
    started: now >= timestamp,
  };
}

const utcStamp = timestamp => new Date(timestamp).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const escapeText = text => text.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

// RFC 5545 lines fold at 75 UTF-8 octets, without splitting a Chinese character.
export function foldLine(line) {
  let output = "";
  let bytes = 0;
  const encoder = new TextEncoder();
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) {
      output += "\r\n ";
      bytes = 1;
    }
    output += character;
    bytes += size;
  }
  return output;
}

export function createCalendar(key, now = Date.now()) {
  if (!isExamKey(key)) throw new TypeError("Unknown exam");
  const exam = EXAMS[key];
  const timestamp = Date.parse(exam.start);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pain is the Integrand//116 Exams//ZH-TW",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:116-${key}@pain-is-the-integrand.github.io`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(timestamp)}`,
    `DTEND:${utcStamp(getExamEnd(exam))}`,
    `SUMMARY:${escapeText(exam.name)}`,
    `DESCRIPTION:${escapeText("時間依大考中心《116 學年度考試簡章》。請留意試場資訊，並於預備鈴響時入場。")}`,
    "URL:https://www.ceec.edu.tw/",
    "END:VEVENT", "END:VCALENDAR", "",
  ].map(foldLine).join("\r\n");
}
