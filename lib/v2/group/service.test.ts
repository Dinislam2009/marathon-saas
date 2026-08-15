import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryGroupRepository } from "./repository.ts";
import { GroupService } from "./service.ts";

describe("GroupService", () => {
  it("creates and lists groups within an organization and course", async () => {
    const service = new GroupService(new InMemoryGroupRepository());
    const group = await service.createGroup({ organizationId: "org-1", courseId: "course-1", name: "Group A", capacity: 20 });
    assert.equal(group.status, "ACTIVE");
    assert.equal((await service.listGroups("org-1", "course-1")).length, 1);
    assert.equal((await service.listGroups("org-2", "course-1")).length, 0);
  });

  it("prevents cross-organization reads and updates", async () => {
    const service = new GroupService(new InMemoryGroupRepository());
    const group = await service.createGroup({ organizationId: "org-a", courseId: "course-1", name: "Math" });
    await assert.rejects(() => service.getGroup("org-b", group.id), /Group not found\./);
    await assert.rejects(() => service.updateGroup("org-b", group.id, { name: "Hacked" }), /Group not found\./);
  });

  it("validates capacity", async () => {
    const service = new GroupService(new InMemoryGroupRepository());
    await assert.rejects(
      () => service.createGroup({ organizationId: "org-1", courseId: "course-1", name: "Bad", capacity: 0 }),
      /positive integer/i,
    );
  });
});
