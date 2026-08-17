import { NextResponse } from "next/server";
import { EnrollmentService } from "@/lib/v2/enrollment/service";
import { PrismaEnrollmentRepository } from "@/lib/v2/enrollment/repository-prisma";
import { prismaV2 } from "@/lib/v2/prisma";
import { validateV2ApiAccess } from "@/lib/v2/auth/guard";

const enrollmentService = new EnrollmentService(new PrismaEnrollmentRepository(prismaV2));

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;

    // 🔒 Auth & Tenant Guard тексерісі
    const auth = await validateV2ApiAccess(request, organizationId);
    if (!auth.authorized) return auth.errorResponse!;

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId") || undefined;
    const studentId = searchParams.get("studentId") || undefined;

    const enrollments = await enrollmentService.listEnrollments(
      organizationId,
      groupId,
      studentId
    );
    return NextResponse.json({ success: true, data: enrollments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}