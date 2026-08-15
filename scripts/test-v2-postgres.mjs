import assert from "node:assert/strict";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, "DATABASE_URL is required");

const client = new Client({ connectionString: databaseUrl });
await client.connect();

try {
  const result = await client.query("SELECT 1 AS connected");
  assert.equal(result.rows[0].connected, 1);
  console.log("✓ PostgreSQL connection is healthy");
} finally {
  await client.end();
}
