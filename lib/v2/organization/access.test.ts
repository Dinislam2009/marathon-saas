import assert from "node:assert/strict";
import test from "node:test";
import { OrganizationAccessError, getActorId } from "./access.ts";

test("requires an authenticated actor id", () => {
  assert.throws(
    () => getActorId(new Request("http://localhost")),
    (error: unknown) => error instanceof OrganizationAccessError && error.status === 401,
  );
});

test("normalizes the actor id from the request header", () => {
  const request = new Request("http://localhost", {
    headers: { "x-loopit-user-id": " user-1 " },
  });
  assert.equal(getActorId(request), "user-1");
});
