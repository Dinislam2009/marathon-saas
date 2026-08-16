import assert from "node:assert/strict";
import test from "node:test";

const cases = [
  {
    name: "program collection",
    module: "../app/api/v2/organizations/[organizationId]/programs/route.ts",
    methods: ["GET", "POST"],
    params: { organizationId: "org-1" },
  },
  {
    name: "program item",
    module: "../app/api/v2/organizations/[organizationId]/programs/[programId]/route.ts",
    methods: ["GET", "PATCH"],
    params: { organizationId: "org-1", programId: "program-1" },
  },
  {
    name: "group collection",
    module: "../app/api/v2/organizations/[organizationId]/groups/route.ts",
    methods: ["GET", "POST"],
    params: { organizationId: "org-1" },
  },
  {
    name: "group item",
    module: "../app/api/v2/organizations/[organizationId]/groups/[groupId]/route.ts",
    methods: ["GET", "PATCH"],
    params: { organizationId: "org-1", groupId: "group-1" },
  },
  {
    name: "student collection",
    module: "../app/api/v2/organizations/[organizationId]/students/route.ts",
    methods: ["GET", "POST"],
    params: { organizationId: "org-1" },
  },
  {
    name: "student item",
    module: "../app/api/v2/organizations/[organizationId]/students/[studentId]/route.ts",
    methods: ["GET", "PATCH"],
    params: { organizationId: "org-1", studentId: "student-1" },
  },
] as const;

for (const route of cases) {
  test(`${route.name}: exports the contract methods`, async () => {
    const handlers = await import(route.module);
    for (const method of route.methods) {
      assert.equal(typeof handlers[method], "function", `${route.name} must export ${method}`);
    }
  });

  test(`${route.name}: rejects missing authentication`, async () => {
    const handlers = await import(route.module);
    const request = new Request(`http://localhost/api/v2/${route.name.replaceAll(" ", "-")}`, {
      method: route.methods[0],
    });
    const response = await handlers[route.methods[0]](request, { params: Promise.resolve(route.params) });
    assert.equal(response.status, 401);
  });
}
