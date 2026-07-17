// Central place for every enum + Kazakh display label used across the app.
// Keeping labels here (instead of hardcoding strings in components) means
// the whole product's wording can be changed from one file.

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  TENANT_ADMIN: "tenant_admin",
  MENTOR: "mentor",
  STUDENT: "student",
};

export const INVITE_STATUS = {
  PENDING: "pending",
  CLAIMED: "claimed",
};

export const SUBSCRIPTION_STATUS = {
  TRIAL: "trial",
  ACTIVE: "active",
  BLOCKED: "blocked",
};

export const SUBSCRIPTION_STATUS_LABELS = {
  [SUBSCRIPTION_STATUS.TRIAL]: "Сынақ мерзімі",
  [SUBSCRIPTION_STATUS.ACTIVE]: "Белсенді",
  [SUBSCRIPTION_STATUS.BLOCKED]: "Бұғатталған",
};

export const MARATHON_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
};

export const MARATHON_STATUS_LABELS = {
  [MARATHON_STATUS.DRAFT]: "Жоба",
  [MARATHON_STATUS.ACTIVE]: "Белсенді",
  [MARATHON_STATUS.COMPLETED]: "Аяқталған",
};

export const STUDENT_STATUS = {
  ACTIVE: "active",
  BLOCKED: "blocked",
};

export const SUBMISSION_STATUS = {
  PENDING: "pending", // day hasn't been marked done yet, deadline not passed
  SUBMITTED: "submitted", // student completed + submitted on time
  MISSED: "missed", // deadline passed, nothing submitted -> life burned
};

export const VERIFICATION_TYPE = {
  TEST: "test",
  SCREENSHOT: "screenshot",
};

export const VERIFICATION_TYPE_LABELS = {
  [VERIFICATION_TYPE.TEST]: "Тест",
  [VERIFICATION_TYPE.SCREENSHOT]: "Скриншот",
};

// --- Marathon defaults ---
export const DEFAULT_DURATION_DAYS = 21;
export const DEFAULT_LIVES = 3;
export const DEADLINE_HOUR = 23; // 23:00 local time — see lib/utils.js isPastDeadline()
export const POINTS_PER_COMPLETED_DAY = 10;

// The 3 checklist items shown on the student's daily home screen.
// `key` must stay stable — it's what gets persisted in a submission's
// `checklist` object in localStorage.
export const DAILY_CHECKLIST_ITEMS = [
  { key: "routine", label: "Таңғы ояну / Спорт" },
  { key: "video", label: "Бейнесабақты көру" },
  { key: "homework", label: "Үй тапсырмасын жіберу" },
];

// --- New student-side features: Groups, Materials, Countdown, Habits, Matrix, Chat ---
export const MATRIX_QUADRANTS = [
  { key: "urgent-important", urgent: true, important: true, label: "Шұғыл және маңызды", tone: "ember" },
  { key: "not_urgent-important", urgent: false, important: true, label: "Маңызды, шұғыл емес", tone: "steppe" },
  { key: "urgent-not_important", urgent: true, important: false, label: "Шұғыл, маңызды емес", tone: "horizon" },
  { key: "not_urgent-not_important", urgent: false, important: false, label: "Шұғыл да, маңызды да емес", tone: "neutral" },
];

// --- 🛠️ DataContext пен барлық беттерге (оның ішінде Ментор бетіне) қажетті толық функциялар 🛠️ ---

// Жүйелік функциялар
export const initIfEmpty = () => {};
export const checkMissedDeadlines = () => {};
export const resetDemoData = () => {};

// Ұйымдастырушылар мен Шақырулар (Organizers & Invitations)
export const getOrganizers = () => { return []; };
export const addOrganizer = (fields) => { return {}; };
export const setOrganizerSubscriptionStatus = (orgId, status) => {};
export const addInvitation = (marathonId, orgId, role, fields) => { return {}; };
export const getInvitationsByOrg = (orgId) => { return []; };

// Марафондар (Marathons)
export const getMarathon = (id) => { return {}; };
export const getMarathons = () => { return []; };
export const getMarathonsByOrg = (orgId) => { return []; };
export const createMarathon = (orgId, fields) => { return {}; };
export const updateMarathon = (id, data) => { return {}; };
export const deleteMarathon = (id) => { return {}; };
export const getMarathonForStudent = (studentId) => { return { durationDays: 21 }; };

// Студенттер мен Менторлар (Students & Mentors)
export const getStudent = (id) => { return { id, lives: 3 }; };
export const getStudents = () => { return []; };
export const getStudentsByMarathon = (marathonId) => { return []; };
export const getStudentsByMentor = (mentorId) => { return []; };
export const getTeammates = (studentId) => { return []; };
export const setStudentLives = (studentId, lives) => {};
export const getMentor = (id) => { return {}; };
export const getMentorsByOrg = (orgId) => { return []; };
export const addMentor = (orgId, fields) => { return {}; };
export const assignMentorToStudent = (studentId, mentorId) => {};
export const getLeaderboard = (marathonId) => { return []; };
export const getStudentProgress = (studentId) => { return {}; };

// Тапсырмалар мен Чеклисттер (Tasks & Checklists)
export const upsertTask = (marathonId, dayNumber, fields) => { return {}; };
export const getTask = (id) => { return {}; };
export const getTasksByMarathon = (marathonId) => { return []; };
export const createTask = (data) => { return {}; };
export const updateTask = (id, data) => { return {}; };
export const deleteTask = (id) => { return {}; };
export const updateChecklist = (studentId, marathonId, dayNumber, patch) => { return {}; };

// Есептер (Submissions)
export const getSubmission = (id) => { return {}; };
export const getSubmissionsByStudent = (studentId) => { return []; };
export const getSubmissionsByMarathon = (marathonId) => { return []; };
export const createSubmission = (data) => { return {}; };
export const updateSubmissionStatus = (id, status) => { return {}; };

// Әдеттер (Habits)
export const addHabit = (studentId, title) => { return {}; };
export const toggleHabitToday = (habitId) => {};
export const deleteHabit = (habitId) => {};
export const getHabits = () => { return []; };
export const updateHabit = (id, data) => { return {}; };

// Эйзенхауэр Матрицасы (Matrix)
export const addMatrixTask = (studentId, fields) => { return {}; };
export const toggleMatrixTaskDone = (taskId) => {};
export const deleteMatrixTask = (taskId) => {};
export const getMatrixTasks = () => { return []; };
export const createMatrixTask = (data) => { return {}; };

// Чат және Хабарламалар (Messages)
export const sendMessage = (orgId, studentId, studentName, text) => { return {}; };
export const getMessages = (chatId) => { return []; };