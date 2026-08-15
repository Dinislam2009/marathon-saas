import { InMemoryGroupRepository } from "../lib/v2/group/repository.ts";
import { GroupService } from "../lib/v2/group/service.ts";

const service = new GroupService(new InMemoryGroupRepository());
const group = await service.createGroup({
  organizationId: "org-smoke",
  courseId: "course-smoke",
  name: "Smoke Group",
  capacity: 15,
});

if (group.status !== "ACTIVE") throw new Error("Group default status mismatch");
if (group.organizationId !== "org-smoke") throw new Error("Group organization mismatch");
if (group.courseId !== "course-smoke") throw new Error("Group course mismatch");

const found = await service.getGroup("org-smoke", group.id);
if (found.id !== group.id) throw new Error("Group read failed");

console.log("Group Core smoke test passed");
