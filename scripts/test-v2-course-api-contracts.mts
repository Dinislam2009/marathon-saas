import assert from "node:assert/strict";
import test from "node:test";

const cases = [
  {
    name: "course collection",
    module: "../app/api/v2/organizations/[organizationId]/courses/route.ts",
    methods: ["GET", "POST"],
    params: { organizationId: "org-1" },
  },
  {
    name: "course item",
    module: "../app/api/v2/organizations/[organizationId]/courses/[courseId]/route.ts",
    methods: ["GET", "PATCH"],
    params: { organizationId: "org-1", courseId: "course-1" },
  },
] as const;

for (const route of cases) {
  test(`${route.name}: exports contract methods`, async () => {
    const handlers = await import(route.module);
    for (const method of route.methods) assert.equal(typeof handlers[method], "function");
  });

  test(`${route.name}: missing authentication returns 401`, async () => {
    const handlers = await import(route.module);
    const method = route.methods[0];
    const request = new Request(`http://localhost/api/v2/${route.name.replaceAll(" ", "-")}`, { method });
    const response = await handlers[method](request, { params: Promise.resolve(route.params) });
    assert.equal(response.status, 401);
  });
}
