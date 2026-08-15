import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const schema = await readFile(new URL("../prisma/schema-v2.prisma", import.meta.url), "utf8");
assert.match(schema, /enum InvitationStatus/);
assert.match(schema, /model OrganizationInvitation/);
assert.match(schema, /token String @unique/);
console.log("Invitation schema contract: OK");
