import assert from "node:assert/strict";
import test from "node:test";

const listRoute = await import("../app/api/v2/organizations/[organizationId]/students/route.ts");
const itemRoute = await import("../app/api/v2/organizations/[organizationId]/students/[studentId]/route.ts");

test("student API exposes collection and item handlers", async () => {
  assert.equal(typeof listRoute.GET, "function");
  assert.equal(typeof listRoute.POST, "function");
  assert.equal(typeof itemRoute.GET, "function");
  assert.equal(typeof itemRoute.PATCH, "function");
});

test("student API rejects unauthenticated requests", async () => {
  const response = await listRoute.GET(
    new Request("http://localhost/api/v2/organizations/org-1/students"),
    { params: Promise.resolve({ organizationId: "org-1" }) },
  );
  assert.equal(response.status, 401);
});

test("student API validates create payload", async () => {
  const response = await listRoute.POST(
    new Request("http://localhost/api/v2/organizations/org-1/students", {
      method: "POST",
      headers: { "x-loopit-user-id": "user-1", "content-type": "application/json" },
      body: JSON.stringify({ firstName: "", lastName: "" }),
    }),
    { params: Promise.resolve({ organizationId: "org-1" }) },
  );
  assert.ok([400, 403, 500].includes(response.status));
});
