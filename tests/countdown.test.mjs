import test from "node:test";
import assert from "node:assert/strict";
import { EXAMS, getCountdown, dayPhrase, isExamKey, createCalendar, foldLine } from "../assets/countdown.mjs";

const start = Date.parse(EXAMS.gsat.start);

test("exam instants are UTC+8, even on a UTC device", () => {
  assert.equal(new Date(EXAMS.gsat.start).toISOString(), "2027-01-22T01:20:00.000Z");
  assert.equal(new Date(EXAMS.ast.start).toISOString(), "2027-07-10T06:00:00.000Z");
});

test("one full day, hour, minute and second decompose correctly", () => {
  assert.deepEqual(getCountdown(start, start - 90061000), {
    totalSeconds: 90061, days: 1, hours: 1, minutes: 1, seconds: 1, started: false,
  });
});

test("one millisecond before start never shows an already-started state", () => {
  const value = getCountdown(start, start - 1);
  assert.equal(value.seconds, 1);
  assert.equal(value.started, false);
  assert.equal(dayPhrase(value), "學測前的最後不到 1 天");
});

test("both exact start and past dates clamp to zero with appropriate copy", () => {
  for (const now of [start, start + 1, start + 86400000]) {
    const value = getCountdown(start, now);
    assert.equal(value.started, true);
    assert.equal(value.totalSeconds, 0);
    assert.equal(value.days, 0);
    assert.equal(dayPhrase(value), "接下來的每一天");
  }
});

test("full-day boundary uses the same rounding in the headline and timer", () => {
  const value = getCountdown(start, start - 86400000);
  assert.equal(value.days, 1);
  assert.equal(value.hours, 0);
  assert.equal(dayPhrase(value), "學測前的最後 1 天");
});

test("suspended tabs recalculate from elapsed time", () => {
  assert.equal(getCountdown(start, start - 125000).minutes, 2);
  assert.equal(getCountdown(start, start - 5000).seconds, 5);
});

test("invalid dates and saved preferences are rejected", () => {
  assert.throws(() => getCountdown("bad-date"), TypeError);
  assert.throws(() => getCountdown(start, NaN), TypeError);
  for (const key of [null, "toString", "__proto__", "other"]) assert.equal(isExamKey(key), false);
  assert.equal(isExamKey("gsat"), true);
  assert.equal(isExamKey("ast"), true);
  assert.throws(() => createCalendar("invalid"), TypeError);
});

test("GSAT calendar exports the correct UTC start and 100-minute duration", () => {
  const ics = createCalendar("gsat", Date.parse("2026-11-14T12:00:00Z"));
  assert.match(ics, /DTSTART:20270122T012000Z\r\n/);
  assert.match(ics, /DTEND:20270122T030000Z\r\n/);
  assert.match(ics, /DTSTAMP:20261114T120000Z/);
  assert.match(ics, /SUMMARY:116 學測・數學 A/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});

test("AST calendar exports the correct UTC start and 80-minute duration", () => {
  const ics = createCalendar("ast", start);
  assert.match(ics, /DTSTART:20270710T060000Z\r\n/);
  assert.match(ics, /DTEND:20270710T072000Z\r\n/);
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75);
});

test("calendar folding preserves Unicode text and obeys the byte limit", () => {
  const line = "DESCRIPTION:" + "數學努力與理解".repeat(15);
  const folded = foldLine(line);
  assert.equal(folded.replace(/\r\n /g, ""), line);
  for (const part of folded.split("\r\n")) assert.ok(Buffer.byteLength(part) <= 75);
});
