import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const files = [
  "lib/v2/organization/types.ts",
  "lib/v2/organization/service.ts",
  "lib/v2/organization/repository.ts",
  "lib/v2/organization/repository-in-memory.ts",
  "lib/v2/organization/service.test.ts",
];

for (const file of files) {
  await readFile(new URL(file, root), "utf8");
}

execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsc", "--noEmit"], {
  stdio: "inherit",
});

console.log("Loopit 2.0 Organization Core files and TypeScript compilation passed.");
