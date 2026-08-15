import { readFile } from "node:fs/promises";

const schemaPath = new URL("../prisma/schema-v2.prisma", import.meta.url);
const schema = await readFile(schemaPath, "utf8");

const requiredModels = [
  "Organization",
  "User",
  "OrganizationMembership",
  "Student",
  "Program",
  "Course",
  "Group",
  "Enrollment",
  "Lesson",
  "Attendance",
];

const missingModels = requiredModels.filter(
  (model) => !new RegExp(`\\bmodel\\s+${model}\\s*\\{`).test(schema),
);

if (missingModels.length) {
  console.error("Missing Loopit 2.0 core models:", missingModels.join(", "));
  process.exit(1);
}

console.log("Loopit 2.0 core schema models detected:", requiredModels.join(", "));
