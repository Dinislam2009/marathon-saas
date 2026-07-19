import { prisma } from "./prisma";
import { getTodayDayNumber, isPastDeadline } from "./utils";
import {
  SUBSCRIPTION_STATUS,
  MARATHON_STATUS,
  STUDENT_STATUS,
  SUBMISSION_STATUS,
  VERIFICATION_TYPE,
  DEFAULT_DURATION_DAYS,
  POINTS_PER_COMPLETED_DAY,
  ROLES,
  INVITE_STATUS,
} from "./constants";

// ---------------------------------------------------------------------
// Organizers
// ---------------------------------------------------------------------

export async function getOrganizers() {
  return await prisma.organizer.findMany({
    include: { user: true }
  });
}

export async function getOrganizer(orgId) {
  return await prisma.organizer.findUnique({ where: { id: orgId } });
}

export async function addOrganizer({ name, ownerName, email, subscriptionPlan, monthlyFee }) {
  // ⚡ Схемаға сай қажетті өрістермен Organizer құру
  return await prisma.organizer.create({
    data: {
      company: name || "Без названия",
      ownerName: ownerName || "",
      email: email.toLowerCase(),
      subscriptionStatus: SUBSCRIPTION_STATUS.TRIAL,
      subscriptionPlan: subscriptionPlan || "Сынақ мерзімі",
      monthlyFee: Number(monthlyFee) || 0,
      nextPaymentDate: new Date(Date.now() + 14 * 86400000),
    },
  });
}

export async function setOrganizerSubscriptionStatus(orgId, status) {
  return await prisma.organizer.update({
    where: { id: orgId },
    data: { subscriptionStatus: status },
  });
}

// ---------------------------------------------------------------------
// Marathons
// ---------------------------------------------------------------------

export async function getMarathonsByOrg(orgId) {
  return await prisma.marathon.findMany({ where: { organizerId: orgId } });
}

export async function getMarathon(marathonId) {
  return await prisma.marathon.findUnique({ where: { id: marathonId } });
}

export async function createMarathon(orgId, { title, description, durationDays, startDate }) {
  // ⚡ Схемада өріс аты `organizerId` деп бекітілгендіктен, түзетілді
  return await prisma.marathon.create({
    data: {
      organizerId: orgId,
      title,
      description: description || "",
      durationDays: Number(durationDays) || DEFAULT_DURATION_DAYS,
      startDate: startDate ? new Date(startDate) : new Date(),
      status: MARATHON_STATUS.ACTIVE,
    },
  });
}

// ---------------------------------------------------------------------
// Mentors
// ---------------------------------------------------------------------

export async function getMentorsByOrg(orgId) {
  return await prisma.mentor.findMany({ where: { organizerId: orgId } });
}

export async function getMentor(mentorId) {
  return await prisma.mentor.findUnique({ where: { id: mentorId } });
}

export async function addMentor(orgId, { name, phone, email, marathonId }) {
  // ⚡ Схема бойынша Mentor үшін `organizerId` міндетті өріс
  return await prisma.mentor.create({
    data: {
      organizerId: orgId,
      name,
      phone,
      email: email.toLowerCase(),
    },
  });
}

export async function getStudentsByMentor(mentorId) {
  return await prisma.student.findMany({ where: { mentorId } });
}

export async function getMarathonsForMentor(mentorId) {
  const students = await prisma.student.findMany({
    where: { mentorId },
    select: { marathonId: true },
  });
  const marathonIds = [...new Set(students.map((s) => s.marathonId))];
  
  if (marathonIds.length > 0) {
    return await prisma.marathon.findMany({
      where: { id: { in: marathonIds } },
    });
  }

  const mentor = await getMentor(mentorId);
  if (mentor) {
    return await prisma.marathon.findMany({
      where: { organizerId: mentor.organizerId, status: MARATHON_STATUS.ACTIVE },
    });
  }
  return [];
}

// ---------------------------------------------------------------------
// Students & Invitations
// ---------------------------------------------------------------------

export async function addStudentToMarathon(marathonId, { name, email, phone }) {
  const marathon = await prisma.marathon.findUnique({ where: { id: marathonId } });
  if (!marathon) throw new Error("Марафон табылмады");

  return await prisma.student.create({
    data: {
      marathonId,
      mentorId: null,
      userId: null,
      name,
      email: email.toLowerCase(),
      phone: phone || "",
      points: 0,
      status: STUDENT_STATUS.ACTIVE,
    },
  });
}

export async function addStudentInvitationByMentor(mentorId, marathonId, { name, email, phone }) {
  const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
  if (!mentor) throw new Error("Ментор табылмады");

  await prisma.invitation.create({
    data: {
      marathonId,
      organizerId: mentor.organizerId,
      role: ROLES.STUDENT,
      fullName: name,
      phone: phone || "",
      email: email.toLowerCase(),
      status: INVITE_STATUS.PENDING,
    },
  });

  return await prisma.student.create({
    data: {
      marathonId: marathonId,
      mentorId: mentorId,
      name: name,
      email: email.toLowerCase(),
      phone: phone || "",
      points: 0,
      status: STUDENT_STATUS.ACTIVE,
    },
  });
}

export async function assignMentorToStudent(studentId, mentorId) {
  return await prisma.student.update({
    where: { id: studentId },
    data: { mentorId },
  });
}

export async function getInvitationsByMarathon(marathonId) {
  return await prisma.invitation.findMany({ where: { marathonId } });
}

export async function addInvitation(marathonId, orgId, role, { fullName, phone, email }) {
  return await prisma.invitation.create({
    data: {
      marathonId,
      organizerId: orgId,
      role,
      fullName,
      phone: phone || "",
      email: email.toLowerCase(),
      status: INVITE_STATUS.PENDING,
    },
  });
}

export async function claimInvitationsForUser(user) {
  const invitations = await prisma.invitation.findMany({
    where: {
      status: INVITE_STATUS.PENDING,
      OR: [
        { email: { equals: user.email, mode: "insensitive" } },
        { phone: user.phone },
      ],
    },
  });

  if (invitations.length === 0) return [];
  const granted = [];

  for (const invite of invitations) {
    if (invite.role === ROLES.STUDENT) {
      const existingStudent = await prisma.student.findFirst({
        where: {
          OR: [{ phone: user.phone }, { email: user.email }],
        },
      });

      if (!existingStudent) {
        const student = await prisma.student.create({
          data: {
            marathonId: invite.marathonId,
            mentorId: null,
            userId: user.id,
            name: invite.fullName,
            email: invite.email,
            phone: invite.phone,
            points: 0,
            status: STUDENT_STATUS.ACTIVE,
          },
        });
        granted.push({ role: ROLES.STUDENT, orgId: invite.organizerId, marathonId: invite.marathonId, id: student.id });
      }
    }
  }

  await prisma.invitation.updateMany({
    where: { id: { in: invitations.map((i) => i.id) } },
    data: { status: INVITE_STATUS.CLAIMED, claimedByUserId: user.id },
  });

  return granted;
}

// ---------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------

export async function getTasksByMarathon(marathonId) {
  return await prisma.task.findMany({
    where: { marathonId },
    orderBy: { dayNumber: "asc" },
  });
}

export async function getTask(marathonId, dayNumber) {
  return await prisma.task.findFirst({
    where: { marathonId, dayNumber },
  });
}

export async function upsertTask(marathonId, dayNumber, fields) {
  const existing = await prisma.task.findFirst({
    where: { marathonId, dayNumber },
  });

  if (!existing) {
    return await prisma.task.create({
      data: {
        marathonId,
        dayNumber,
        title: fields.title || "",
        videoUrl: fields.videoUrl || "",
        content: fields.content || "",
        verificationType: fields.verificationType || VERIFICATION_TYPE.TEST,
      },
    });
  }

  return await prisma.task.update({
    where: { id: existing.id },
    data: fields,
  });
}

// ---------------------------------------------------------------------
// Students Queries
// ---------------------------------------------------------------------

export async function getStudentsByMarathon(marathonId) {
  return await prisma.student.findMany({ where: { marathonId } });
}

export async function getStudent(studentId) {
  return await prisma.student.findUnique({ where: { id: studentId } });
}

export async function getMarathonForStudent(studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { marathon: true },
  });
  return student ? student.marathon : null;
}

export async function setStudentStatus(studentId, status) {
  return await prisma.student.update({
    where: { id: studentId },
    data: { status },
  });
}

export async function getLeaderboard(marathonId) {
  return await prisma.student.findMany({
    where: { marathonId },
    orderBy: { points: "desc" },
  });
}

// ---------------------------------------------------------------------
// Submissions (⚡ JSON форматы схемаға толық сәйкестендірілді)
// ---------------------------------------------------------------------

export async function getSubmissionsByStudent(studentId) {
  return await prisma.submission.findMany({ where: { studentId } });
}

export async function getSubmission(studentId, dayNumber) {
  return await prisma.submission.findFirst({
    where: { studentId, dayNumber },
  });
}

export async function updateChecklist(studentId, marathonId, dayNumber, patch) {
  const existing = await prisma.submission.findFirst({
    where: { studentId, dayNumber },
  });

  if (existing && existing.status !== SUBMISSION_STATUS.PENDING) return existing;

  // Схемадағы Json өрісін қауіпсіз парсинг жасау
  let currentChecklist = { routine: false, video: false, homework: false };
  if (existing && existing.checklist) {
    currentChecklist = typeof existing.checklist === "string" 
      ? JSON.parse(existing.checklist) 
      : existing.checklist;
  }

  const updatedChecklist = {
    routine: patch.routine !== undefined ? patch.routine : currentChecklist.routine,
    video: patch.video !== undefined ? patch.video : currentChecklist.video,
    homework: patch.homework !== undefined ? patch.homework : currentChecklist.homework,
  };

  const allDone = updatedChecklist.routine && updatedChecklist.video && updatedChecklist.homework;
  const nextStatus = allDone ? SUBMISSION_STATUS.SUBMITTED : SUBMISSION_STATUS.PENDING;
  const submittedAt = allDone ? new Date() : null;

  let submission;
  if (!existing) {
    submission = await prisma.submission.create({
      data: {
        studentId,
        dayNumber,
        status: nextStatus,
        checklist: updatedChecklist,
        submittedAt,
      },
    });
  } else {
    submission = await prisma.submission.update({
      where: { id: existing.id },
      data: {
        checklist: updatedChecklist,
        status: nextStatus,
        submittedAt,
      },
    });
  }

  if (allDone) {
    await prisma.student.update({
      where: { id: studentId },
      data: { points: { increment: POINTS_PER_COMPLETED_DAY } },
    });
  }

  return submission;
}

// ---------------------------------------------------------------------
// Deadline Engine
// ---------------------------------------------------------------------

export async function checkMissedDeadlines() {
  const marathons = await prisma.marathon.findMany({
    where: { status: MARATHON_STATUS.ACTIVE },
  });
  if (marathons.length === 0) return;

  for (const marathon of marathons) {
    const todayDay = getTodayDayNumber(marathon);
    if (!todayDay) continue;

    const students = await prisma.student.findMany({
      where: { marathonId: marathon.id },
    });

    for (const student of students) {
      for (let day = 1; day <= todayDay; day++) {
        if (!isPastDeadline(marathon, day)) continue;

        const record = await prisma.submission.findFirst({
          where: { studentId: student.id, dayNumber: day },
        });

        if (record && record.status !== SUBMISSION_STATUS.PENDING) continue;

        const defaultChecklist = { routine: false, video: false, homework: false };

        if (record) {
          await prisma.submission.update({
            where: { id: record.id },
            data: { status: SUBMISSION_STATUS.MISSED },
          });
        } else {
          await prisma.submission.create({
            data: {
              studentId: student.id,
              dayNumber: day,
              status: SUBMISSION_STATUS.MISSED,
              checklist: defaultChecklist,
            },
          });
        }
      }
    }
  }
}

// ---------------------------------------------------------------------
// Groups & Materials
// ---------------------------------------------------------------------

export async function getTeammates(studentId) {
  const student = await getStudent(studentId);
  if (!student) return [];
  return await prisma.student.findMany({
    where: { marathonId: student.marathonId, id: { not: studentId } },
  });
}

export async function getMaterialsForStudent(studentId) {
  const marathon = await getMarathonForStudent(studentId);
  if (!marathon) return [];
  return await prisma.task.findMany({
    where: {
      marathonId: marathon.id,
      OR: [{ videoUrl: { not: "" } }, { content: { not: "" } }],
    },
  });
}

// ---------------------------------------------------------------------
// Habits (⚡ Схемадағы Json массивін қауіпсіз басқару)
// ---------------------------------------------------------------------

export async function getHabitsByStudent(studentId) {
  return await prisma.habit.findMany({ where: { studentId } });
}

export async function addHabit(studentId, title) {
  return await prisma.habit.create({
    data: {
      studentId,
      title,
      doneDates: [],
    },
  });
}

export async function toggleHabitToday(habitId) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit) return;

  let currentDates = Array.isArray(habit.doneDates) 
    ? habit.doneDates 
    : (typeof habit.doneDates === "string" ? JSON.parse(habit.doneDates) : []);

  const has = currentDates.includes(todayKey);
  const nextDates = has
    ? currentDates.filter((d) => d !== todayKey)
    : [...currentDates, todayKey];

  return await prisma.habit.update({
    where: { id: habitId },
    data: { doneDates: nextDates },
  });
}

export async function deleteHabit(habitId) {
  return await prisma.habit.delete({ where: { id: habitId } });
}

// ---------------------------------------------------------------------
// Eisenhower Matrix
// ---------------------------------------------------------------------

export async function getMatrixTasksByStudent(studentId) {
  return await prisma.matrixTask.findMany({ where: { studentId } });
}

export async function addMatrixTask(studentId, { title, urgent, important }) {
  return await prisma.matrixTask.create({
    data: {
      studentId,
      title,
      urgent: Boolean(urgent),
      important: Boolean(important),
      done: false,
    },
  });
}

export async function toggleMatrixTaskDone(taskId) {
  const task = await prisma.matrixTask.findUnique({ where: { id: taskId } });
  if (!task) return;

  return await prisma.matrixTask.update({
    where: { id: taskId },
    data: { done: !task.done },
  });
}

export async function deleteMatrixTask(taskId) {
  return await prisma.matrixTask.delete({ where: { id: taskId } });
}

// ---------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------

export async function getMessagesByOrg(orgId) {
  return await prisma.chatMessage.findMany({
    where: { organizerId: orgId },
    orderBy: { createdAt: "asc" },
  });
}

export async function sendMessage(orgId, studentId, studentName, text) {
  return await prisma.chatMessage.create({
    data: {
      organizerId: orgId,
      studentId,
      studentName,
      text,
    },
  });
}