import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryOrganizationRepository } from "./repository-in-memory";
import { OrganizationService } from "./service";

const repo = () => new InMemoryOrganizationRepository();

describe("OrganizationService", () => {
  it("creates and reads an organization", async () => {
    const service = new OrganizationService(repo());
    const created = await service.createOrganization({
      name: "Qadam Education",
      slug: "qadam-education",
      ownerUserId: "user-1",
    });

    assert.equal(created.name, "Qadam Education");
    assert.equal(created.slug, "qadam-education");

    const found = await service.getOrganization(created.id, "user-1");
    assert.equal(found?.id, created.id);
  });

  it("rejects cross-organization access", async () => {
    const repository = repo();
    const service = new OrganizationService(repository);

    const first = await service.createOrganization({
      name: "Org A",
      slug: "org-a",
      ownerUserId: "owner-a",
    });
    const second = await service.createOrganization({
      name: "Org B",
      slug: "org-b",
      ownerUserId: "owner-b",
    });

    await assert.rejects(
      () => service.getOrganization(second.id, "owner-a"),
      /Organization access denied/,
    );

    assert.notEqual(first.id, second.id);
  });

  it("prevents changing the owner's role", async () => {
    const repository = repo();
    const service = new OrganizationService(repository);
    const organization = await service.createOrganization({
      name: "Qadam Education",
      slug: "qadam",
      ownerUserId: "owner-1",
    });

    await assert.rejects(
      () =>
        service.changeMemberRole(
          organization.id,
          "owner-1",
          "owner-1",
          "ADMIN",
        ),
      /OWNER role transfer requires a dedicated ownership flow\./,
    );
  });
});
