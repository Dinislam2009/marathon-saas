import { NextResponse } from "next/server";
import { StudentService } from "@/lib/v2/student/service";
import { PrismaStudentRepository } from "@/lib/v2/student/repository-prisma";
import { prismaV2 } from "@/lib/v2/prisma";

const studentService = new StudentService(new PrismaStudentRepository(prismaV2));

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string; studentId: string }> }
) {
  try {
    const { organizationId, studentId } = await params;
    const student = await studentService.getStudent(organizationId, studentId);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("GET /students/[studentId] error:", error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ organizationId: string; studentId: string }> }
) {
  try {
    const { organizationId, studentId } = await params;
    const body = await request.json();

    const updatedStudent = await studentService.updateStudent(organizationId, studentId, {
      groupId: body.groupId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      status: body.status,
      source: body.source,
      notes: body.notes,
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("PATCH /students/[studentId] error:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string; studentId: string }> }
) {
  try {
    const { organizationId, studentId } = await params;
    await studentService.deleteStudent(organizationId, studentId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /students/[studentId] error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}