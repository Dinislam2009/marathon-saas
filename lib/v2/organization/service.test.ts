import { describe, expect, it } from "node:test";
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

    expect(created.name).toBe("Qadam Education");
    expect(created.slug).toBe("qadam-education");

    const found = await service.getOrganization("user-1", created.id);
    expect(found.id).toBe(created.id);
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

    await expect(
      service.getOrganization("owner-a", second.id),
    ).rejects.toThrow("Organization access denied");

    expect(first.id).not.toBe(second.id);
  });

  it("prevents changing the owner's role", async () => {
    const repository = repo();
    const service = new OrganizationService(repository);
    const organization = await service.createOrganization({
      name: "Qadam Education",
      slug: "qadam",
      ownerUserId: "owner-1",
    });

    await expect(
      service.changeMemberRole(
        "owner-1",
        organization.id,
        "owner-1",
        "ADMIN",
      ),
    ).rejects.toThrow("Owner role cannot be changed");
  });
});
