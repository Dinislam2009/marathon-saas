import { getItem, setItem } from "./storage";
import { generateId } from "./id";
import { buildSeedData } from "./seed";
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
// PHASE 2 MIGRATION NOTE
// Every function below reads/writes through storage.js (localStorage).
// ---------------------------------------------------------------------

function readCollection(name) {
  return getItem(name, []);
}
function writeCollection(name, list) {
  setItem(name, list);
}

export function initIfEmpty() {
  if (getItem("organizers", null) !== null) return;
  resetDemoData();
}

export function resetDemoData() {
  const seed = buildSeedData();
  writeCollection("organizers", seed.organizers);
  writeCollection("mentors", seed.mentors);
  writeCollection("marathons", seed.marathons);
  writeCollection("tasks", seed.tasks);
  writeCollection("students", seed.students);
  writeCollection("submissions", seed.submissions);
  writeCollection("invitations", []);
}

// ---------------------------------------------------------------------
// Organizers
// ---------------------------------------------------------------------

export function getOrganizers() {
  return readCollection("organizers");
}

export function getOrganizer(orgId) {
  return readCollection("organizers").find((o) => o.id === orgId) || null;
}

export function addOrganizer({ name, ownerName, email, subscriptionPlan, monthlyFee }) {
  const organizers = readCollection("organizers");
  const organizer = {
    id: generateId("org"),
    name,
    ownerName,
    email,
    subscriptionStatus: SUBSCRIPTION_STATUS.TRIAL,
    subscriptionPlan: subscriptionPlan || "Сынақ мерзімі",
    monthlyFee: Number(monthlyFee) || 0,
    nextPaymentDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  writeCollection("organizers", [...organizers, organizer]);
  return organizer;
}

export function setOrganizerSubscriptionStatus(orgId, status) {
  const organizers = readCollection("organizers").map((o) =>
    o.id === orgId ? { ...o, subscriptionStatus: status } : o
  );
  writeCollection("organizers", organizers);
}

// ---------------------------------------------------------------------
// Marathons
// ---------------------------------------------------------------------

export function getMarathonsByOrg(orgId) {
  return readCollection("marathons").filter((m) => m.orgId === orgId);
}

export function getMarathon(marathonId) {
  return readCollection("marathons").find((m) => m.id === marathonId) || null;
}

export function createMarathon(orgId, { title, description, durationDays, startDate }) {
  const marathons = readCollection("marathons");
  const marathon = {
    id: generateId("marathon"),
    orgId,
    title,
    description: description || "",
    durationDays: Number(durationDays) || DEFAULT_DURATION_DAYS,
    startDate: startDate || new Date().toISOString(),
    status: MARATHON_STATUS.ACTIVE,
    createdAt: new Date().toISOString(),
  };
  writeCollection("marathons", [...marathons, marathon]);
  return marathon;
}

// ---------------------------------------------------------------------
// Mentors
// ---------------------------------------------------------------------

export function getMentorsByOrg(orgId) {
  return readCollection("mentors").filter((m) => m.orgId === orgId);
}

export function getMentor(mentorId) {
  return readCollection("mentors").find((m) => m.id === mentorId) || null;
}

export function addMentor(orgId, { name, phone, email }) {
  const mentors = readCollection("mentors");
  const mentor = {
    id: generateId("mentor"),
    orgId,
    name,
    phone,
    email: email || "",
    createdAt: new Date().toISOString(),
  };
  writeCollection("mentors", [...mentors, mentor]);
  return mentor;
}

export function getStudentsByMentor(mentorId) {
  return readCollection("students").filter((s) => s.mentorId === mentorId);
}

export function getMarathonsForMentor(mentorId) {
  const students = getStudentsByMentor(mentorId);
  const marathonIds = [...new Set(students.map((s) => s.marathonId))];
  const list = marathonIds.map((id) => getMarathon(id)).filter(Boolean);
  
  // Егер жаңа ментор болып, әлі оқушы бекітілмесе, ұйымның барлық активті марафонын көре алсын
  if (list.length === 0) {
    const mentor = getMentor(mentorId);
    if (mentor) return getMarathonsByOrg(mentor.orgId);
  }
  return list;
}

export function assignMentorToStudent(studentId, mentorId) {
  const students = readCollection("students").map((s) =>
    s.id === studentId ? { ...s, mentorId } : s
  );
  writeCollection("students", students);
}

// ---------------------------------------------------------------------
// Invitations — Осы жерде телефон арқылы доступ ашу логикасы жұмыс істейді
// ---------------------------------------------------------------------

export function getInvitationsByMarathon(marathonId) {
  return readCollection("invitations").filter((i) => i.marathonId === marathonId);
}

export function addInvitation(marathonId, orgId, role, { fullName, phone, email }) {
  const invitations = readCollection("invitations");
  const invite = {
    id: generateId("invite"),
    marathonId,
    orgId,
    role, 
    fullName,
    phone: phone || "",
    email: email || "",
    status: INVITE_STATUS.PENDING,
    createdAt: new Date().toISOString(),
  };
  writeCollection("invitations", [...invitations, invite]);
  return invite;
}

// Ментор панелінен телефон арқылы марафонға доступ ашып, бірден студент қылып тіркеу функциясы
export function addStudentInvitationByMentor(mentorId, marathonId, { name, email, phone }) {
  const mentor = getMentor(mentorId);
  if (!mentor) throw new Error("Ментор табылмады");

  // 1. Шақырулар тізіміне телефон мен email-ді тіркейміз (болашақта тіркелу үшін)
  addInvitation(marathonId, mentor.orgId, ROLES.STUDENT, { fullName: name, phone, email });

  // 2. Демо нұсқада бірден тексеріп, студенттер базасына да жазып қоямыз (Доступ ашылуы үшін)
  const students = readCollection("students");
  const newStudent = {
    id: generateId("student"),
    orgId: mentor.orgId,
    marathonId: marathonId,
    mentorId: mentorId, // осы менторға бекітіледі
    userId: generateId("usr"),
    name: name,
    email: email,
    phone: phone, // телефон нөмірі
    points: 0,
    status: STUDENT_STATUS.ACTIVE,
    joinedAt: new Date().toISOString(),
  };

  writeCollection("students", [...students, newStudent]);
  return newStudent;
}

export function claimInvitationsForUser(user) {
  const invitations = readCollection("invitations");
  const matches = invitations.filter(
    (i) =>
      i.status === INVITE_STATUS.PENDING &&
      ((i.email && user.email && i.email.toLowerCase() === user.email.toLowerCase()) ||
        (i.phone && user.phone && i.phone === user.phone))
  );
  if (matches.length === 0) return [];

  const granted = [];

  matches.forEach((invite) => {
    if (invite.role === ROLES.STUDENT) {
      const students = readCollection("students");
      // Егер осы телефонмен студент бұрын қосылмаған болса ғана қосады
      if (!students.some(s => s.phone === user.phone || (s.email && s.email === user.email))) {
        const student = {
          id: generateId("student"),
          orgId: invite.orgId,
          marathonId: invite.marathonId,
          mentorId: null,
          userId: user.id,
          name: invite.fullName,
          email: invite.email,
          phone: invite.phone,
          points: 0,
          status: STUDENT_STATUS.ACTIVE,
          joinedAt: new Date().toISOString(),
        };
        writeCollection("students", [...students, student]);
        granted.push({ role: ROLES.STUDENT, orgId: invite.orgId, marathonId: invite.marathonId, id: student.id });
      }
    }
  });

  writeCollection(
    "invitations",
    invitations.map((i) =>
      matches.some((m) => m.id === i.id)
        ? { ...i, status: INVITE_STATUS.CLAIMED, claimedByUserId: user.id }
        : i
    )
  );

  return granted;
}

// ---------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------

export function getTasksByMarathon(marathonId) {
  return readCollection("tasks")
    .filter((t) => t.marathonId === marathonId)
    .sort((a, b) => a.dayNumber - b.dayNumber);
}

export function getTask(marathonId, dayNumber) {
  return (
    readCollection("tasks").find(
      (t) => t.marathonId === marathonId && t.dayNumber === dayNumber
    ) || null
  );
}

export function upsertTask(marathonId, dayNumber, fields) {
  const tasks = readCollection("tasks");
  const idx = tasks.findIndex(
    (t) => t.marathonId === marathonId && t.dayNumber === dayNumber
  );
  if (idx === -1) {
    const task = {
      id: generateId("task"),
      marathonId,
      dayNumber,
      title: "",
      videoUrl: "",
      content: "",
      verificationType: VERIFICATION_TYPE.TEST,
      ...fields,
      createdAt: new Date().toISOString(),
    };
    writeCollection("tasks", [...tasks, task]);
    return task;
  }
  const updated = { ...tasks[idx], ...fields };
  writeCollection(
    "tasks",
    tasks.map((t, i) => (i === idx ? updated : t))
  );
  return updated;
}

// ---------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------

export function getStudentsByMarathon(marathonId) {
  return readCollection("students").filter((s) => s.marathonId === marathonId);
}

export function getStudent(studentId) {
  return readCollection("students").find((s) => s.id === studentId) || null;
}

export function getMarathonForStudent(studentId) {
  const student = getStudent(studentId);
  return student ? getMarathon(student.marathonId) : null;
}

export function setStudentStatus(studentId, status) {
  const students = readCollection("students").map((s) =>
    s.id === studentId ? { ...s, status } : s
  );
  writeCollection("students", students);
}

export function getLeaderboard(marathonId) {
  return getStudentsByMarathon(marathonId)
    .slice()
    .sort((a, b) => b.points - a.points);
}

export function addStudentToMarathon(marathonId, { name, email, phone }) {
  const students = readCollection("students");
  const marathon = getMarathon(marathonId);
  
  if (!marathon) throw new Error("Марафон табылмады");

  const newStudent = {
    id: generateId("student"),
    orgId: marathon.orgId,
    marathonId: marathonId,
    mentorId: null,
    userId: generateId("usr"), 
    name: name,
    email: email,
    phone: phone || "",
    points: 0,
    status: STUDENT_STATUS.ACTIVE,
    joinedAt: new Date().toISOString(),
  };

  writeCollection("students", [...students, newStudent]);
  return newStudent;
}

// ---------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------

export function getSubmissionsByStudent(studentId) {
  return readCollection("submissions").filter((s) => s.studentId === studentId);
}

export function getSubmission(studentId, dayNumber) {
  return (
    readCollection("submissions").find(
      (s) => s.studentId === studentId && s.dayNumber === dayNumber
    ) || null
  );
}

export function updateChecklist(studentId, marathonId, dayNumber, patch) {
  const submissions = readCollection("submissions");
  const idx = submissions.findIndex(
    (s) => s.studentId === studentId && s.dayNumber === dayNumber
  );
  const existing =
    idx > -1
      ? submissions[idx]
      : {
          id: generateId("sub"),
          studentId,
          marathonId,
          dayNumber,
          status: SUBMISSION_STATUS.PENDING,
          checklist: { routine: false, video: false, homework: false },
          submittedAt: null,
        };

  if (existing.status !== SUBMISSION_STATUS.PENDING) return existing;

  const checklist = { ...existing.checklist, ...patch };
  const allDone = Object.values(checklist).every(Boolean);
  const updated = {
    ...existing,
    checklist,
    status: allDone ? SUBMISSION_STATUS.SUBMITTED : SUBMISSION_STATUS.PENDING,
    submittedAt: allDone ? new Date().toISOString() : null,
  };

  writeCollection(
    "submissions",
    idx > -1 ? submissions.map((s, i) => (i === idx ? updated : s)) : [...submissions, updated]
  );

  if (allDone) {
    const students = readCollection("students").map((s) =>
      s.id === studentId ? { ...s, points: s.points + POINTS_PER_COMPLETED_DAY } : s
    );
    writeCollection("students", students);
  }

  return updated;
}

// ---------------------------------------------------------------------
// Deadline Engine
// ---------------------------------------------------------------------

export function checkMissedDeadlines() {
  const marathons = readCollection("marathons").filter(
    (m) => m.status === MARATHON_STATUS.ACTIVE
  );
  if (marathons.length === 0) return;

  let submissions = readCollection("submissions");
  let students = readCollection("students");
  let changed = false;

  marathons.forEach((marathon) => {
    const todayDay = getTodayDayNumber(marathon);
    if (!todayDay) return;

    students
      .filter((s) => s.marathonId === marathon.id)
      .forEach((student) => {
        for (let day = 1; day <= todayDay; day++) {
          if (!isPastDeadline(marathon, day)) continue;

          const idx = submissions.findIndex(
            (s) => s.studentId === student.id && s.dayNumber === day
          );
          const record = idx > -1 ? submissions[idx] : null;
          if (record && record.status !== SUBMISSION_STATUS.PENDING) continue;

          const missedRecord = record
            ? { ...record, status: SUBMISSION_STATUS.MISSED }
            : {
                id: generateId("sub"),
                studentId: student.id,
                marathonId: marathon.id,
                dayNumber: day,
                status: SUBMISSION_STATUS.MISSED,
                checklist: { routine: false, video: false, homework: false },
                submittedAt: null,
              };

          submissions =
            idx > -1
              ? submissions.map((s, i) => (i === idx ? missedRecord : s))
              : [...submissions, missedRecord];
          changed = true;
        }
      });
  });

  if (changed) {
    writeCollection("submissions", submissions);
  }
}

// ---------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------

export function getTeammates(studentId) {
  const student = getStudent(studentId);
  if (!student) return [];
  return getStudentsByMarathon(student.marathonId).filter((s) => s.id !== studentId);
}

// ---------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------

export function getMaterialsForStudent(studentId) {
  const marathon = getMarathonForStudent(studentId);
  if (!marathon) return [];
  return getTasksByMarathon(marathon.id).filter((t) => t.videoUrl || t.content);
}

// ---------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------

export function getHabitsByStudent(studentId) {
  return readCollection("habits").filter((h) => h.studentId === studentId);
}

export function addHabit(studentId, title) {
  const habits = readCollection("habits");
  const habit = { id: generateId("habit"), studentId, title, doneDates: [], createdAt: new Date().toISOString() };
  writeCollection("habits", [...habits, habit]);
  return habit;
}

export function toggleHabitToday(habitId) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const habits = readCollection("habits").map((h) => {
    if (h.id !== habitId) return h;
    const has = h.doneDates.includes(todayKey);
    return { ...h, doneDates: has ? h.doneDates.filter((d) => d !== todayKey) : [...h.doneDates, todayKey] };
  });
  writeCollection("habits", habits);
}

export function deleteHabit(habitId) {
  writeCollection("habits", readCollection("habits").filter((h) => h.id !== habitId));
}

// ---------------------------------------------------------------------
// Eisenhower Matrix
// ---------------------------------------------------------------------

export function getMatrixTasksByStudent(studentId) {
  return readCollection("matrixTasks").filter((t) => t.studentId === studentId);
}

export function addMatrixTask(studentId, { title, urgent, important }) {
  const tasks = readCollection("matrixTasks");
  const task = {
    id: generateId("mtx"),
    studentId,
    title,
    urgent: Boolean(urgent),
    important: Boolean(important),
    done: false,
    createdAt: new Date().toISOString(),
  };
  writeCollection("matrixTasks", [...tasks, task]);
  return task;
}

export function toggleMatrixTaskDone(taskId) {
  writeCollection(
    "matrixTasks",
    readCollection("matrixTasks").map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
  );
}

export function deleteMatrixTask(taskId) {
  writeCollection("matrixTasks", readCollection("matrixTasks").filter((t) => t.id !== taskId));
}

// ---------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------

export function getMessagesByOrg(orgId) {
  return readCollection("chatMessages")
    .filter((m) => m.orgId === orgId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export function sendMessage(orgId, studentId, studentName, text) {
  const messages = readCollection("chatMessages");
  const message = {
    id: generateId("msg"),
    orgId,
    studentId,
    studentName,
    text,
    createdAt: new Date().toISOString(),
  };
  writeCollection("chatMessages", [...messages, message]);
  return message;
}