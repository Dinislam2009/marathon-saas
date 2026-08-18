import { NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/v2/analytics/service";
import { prismaV2 } from "@/lib/v2/prisma";

const analyticsService = new AnalyticsService(prismaV2);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string; studentId: string }> }
) {
  try {
    const { organizationId, studentId } = await params;
    const data = await analyticsService.getStudentAnalytics(organizationId, studentId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}