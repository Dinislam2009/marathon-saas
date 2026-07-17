import { DEADLINE_HOUR } from "./constants";

// Tiny classnames joiner — avoids pulling in `clsx` for one function.
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date, options = { day: "numeric", month: "long" }) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d?.getTime?.())) return "";
  try {
    return d.toLocaleDateString("kk-KZ", options);
  } catch {
    return d.toLocaleDateString();
  }
}

// The calendar date that corresponds to "day N" of a marathon.
export function getDayDate(marathon, dayNumber) {
  const start = new Date(marathon.startDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + (dayNumber - 1));
  return start;
}

// Which day number (1..durationDays) "today" falls on for this marathon.
// Returns null if the marathon hasn't started yet, and durationDays if
// it's already finished (so the UI can show the final grid instead of
// an out-of-range day).
export function getTodayDayNumber(marathon) {
  if (!marathon?.startDate) return 1;
  const start = new Date(marathon.startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - start) / 86400000) + 1;
  if (diffDays < 1) return null; // marathon hasn't started
  return Math.min(diffDays, marathon.durationDays);
}

// Deadline for a given day is 23:00 (DEADLINE_HOUR) on that day's date.
export function getDeadline(marathon, dayNumber) {
  const deadline = getDayDate(marathon, dayNumber);
  deadline.setHours(DEADLINE_HOUR, 0, 0, 0);
  return deadline;
}

export function isPastDeadline(marathon, dayNumber, now = new Date()) {
  return now > getDeadline(marathon, dayNumber);
}

// Formats digits into "+7 (7XX) XXX-XX-XX" as the user types.
// Kazakhstan mobile numbers only — always starts with +7.
export function formatKzPhone(raw) {
  const digits = raw.replace(/\D/g, "").replace(/^7/, "").replace(/^8/, "").slice(0, 10);
  let out = "+7";
  if (digits.length > 0) out += ` (${digits.slice(0, 3)}`;
  if (digits.length >= 3) out += `)`;
  if (digits.length > 3) out += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) out += `-${digits.slice(8, 10)}`;
  return out;
}

export function isValidKzPhone(value) {
  return /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(value);
}
