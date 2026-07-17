// Thin wrapper around window.localStorage.
//
// Why this file exists on its own: every other data function in
// lib/data.js reads/writes through get()/set() instead of touching
// localStorage directly. In Phase 2, when organizers/marathons/students
// move to Firebase or PostgreSQL, this is the ONLY file that needs to
// change shape (or be deleted) — lib/data.js's function signatures stay
// the same, so nothing importing from it has to change.

const NAMESPACE = "marathon-saas";

function key(name) {
  return `${NAMESPACE}:${name}`;
}

export function getItem(name, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key(name));
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`storage.getItem("${name}") failed:`, err);
    return fallback;
  }
}

export function setItem(name, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(name), JSON.stringify(value));
  } catch (err) {
    console.error(`storage.setItem("${name}") failed:`, err);
  }
}

export function removeItem(name) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(name));
}

// Wipes every key this app owns (used by the "demo deректерін тазарту"
// reset button) without touching localStorage keys other apps may use.
export function clearAll(names) {
  if (typeof window === "undefined") return;
  names.forEach((name) => window.localStorage.removeItem(key(name)));
}
