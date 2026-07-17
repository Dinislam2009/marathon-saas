// Small ID helper so we don't need an extra npm dependency (like uuid)
// just for Phase 1. crypto.randomUUID() is available in all modern
// browsers and in Node 20+, which this project already requires.
export function generateId(prefix = "id") {
  const uuid =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${uuid}`;
}
