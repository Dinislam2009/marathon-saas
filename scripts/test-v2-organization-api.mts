import assert from "node:assert/strict";
import test from "node:test";
import { parseCreateOrganizationRequest } from "../lib/v2/organization/api.ts";

test("create organization request requires an authenticated owner", () => {
  assert.throws(
    () => parseCreateOrganizationRequest({ name: "Loopit Academy", slug: "loopit-academy" }, null),
    /Authentication required/,
  );
});

test("create organization request normalizes and preserves supported fields", () => {
  const input = parseCreateOrganizationRequest(
    {
      name: "  Loopit Academy  ",
      slug: "  loopit-academy  ",
      email: "academy@example.com",
      timezone: "Asia/Almaty",
      currency: "KZT",
    },
    "user-1",
  );

  assert.deepEqual(input, {
    name: "Loopit Academy",
    slug: "loopit-academy",
    ownerUserId: "user-1",
    logoUrl: undefined,
    phone: undefined,
    email: "academy@example.com",
    address: undefined,
    timezone: "Asia/Almaty",
    currency: "KZT",
  });
});

test("create organization request rejects missing required fields", () => {
  assert.throws(
    () => parseCreateOrganizationRequest({ slug: "loopit-academy" }, "user-1"),
    /Organization name is required/,
  );

  assert.throws(
    () => parseCreateOrganizationRequest({ name: "Loopit Academy" }, "user-1"),
    /Organization slug is required/,
  );
});
