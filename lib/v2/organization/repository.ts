import { prismaV2 } from "../prisma";
import { PrismaOrganizationRepository } from "./repository-prisma";

/** Default production repository for Loopit 2.0 Organization services. */
export const organizationRepository = new PrismaOrganizationRepository(prismaV2);
