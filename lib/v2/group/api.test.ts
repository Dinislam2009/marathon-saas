import assert from "node:assert/strict";
import test from "node:test";
import { GroupApiService } from "./api.ts";

const repository = {
  async create(input: any) {
    return { id: "g1", ...input };
  },
  async findById(organizationId: string, groupId: string) {
    return organizationId === "org1" && groupId === "g1" ? { id: "g1" } : null;
  },
  async list(organizationId: string, courseId?: string) {
    return organizationId === "org1" && (!courseId || courseId === "c1") ? [{ id: "g1" }] : [];
  },
  async update(organizationId: string, groupId: string, input: any) {
    return { id: groupId, organizationId, ...input };
  },
};

test("creates and gets a group", async () => {
  const service = new GroupApiService(repository as never);
  assert.equal((await service.createGroup({ organizationId: "org1", courseId: "c1", name: "A" })).id, "g1");
  assert.deepEqual(await service.getGroup("org1", "g1"), { id: "g1" });
});

test("lists and updates groups", async () => {
  const service = new GroupApiService(repository as never);
  assert.deepEqual(await service.listGroups("org1", "c1"), [{ id: "g1" }]);
  assert.deepEqual(await service.updateGroup("org1", "g1", { name: "B" }), { id: "g1", organizationId: "org1", name: "B" });
});
