import { NextResponse } from "next/server";
import { StudentService } from "@/lib/v2/student/service";
import { PrismaStudentRepository } from "@/lib/v2/student/repository-prisma";
import { prismaV2 } from "@/lib/v2/prisma";

const studentService = new StudentService(new PrismaStudentRepository(prismaV2));

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId") || undefined;

    const students = await studentService.listStudents(organizationId, groupId);
    return NextResponse.json(students);
  } catch (error) {
    console.error("GET /students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const body = await request.json();

    if (!body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: "firstName and lastName are required" },
        { status: 400 }
      );
    }

    const student = await studentService.createStudent({
      organizationId,
      groupId: body.groupId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      status: body.status,
      source: body.source,
      notes: body.notes,
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("POST /students error:", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}