import type { CreateOrganizationInput } from "./types.ts";

export function parseCreateOrganizationRequest(
  body: unknown,
  ownerUserId: string | null,
): CreateOrganizationInput {
  if (!ownerUserId) {
    throw new Error("Authentication required.");
  }

  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const value = body as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const slug = typeof value.slug === "string" ? value.slug.trim() : "";

  if (!name) throw new Error("Organization name is required.");
  if (!slug) throw new Error("Organization slug is required.");

  const optionalString = (key: string) => {
    const item = value[key];
    return item === undefined || item === null ? undefined : String(item);
  };

  return {
    name,
    slug,
    ownerUserId,
    logoUrl: optionalString("logoUrl"),
    phone: optionalString("phone"),
    email: optionalString("email"),
    address: optionalString("address"),
    timezone: optionalString("timezone"),
    currency: optionalString("currency"),
  };
}
