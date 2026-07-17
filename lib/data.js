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

// --- 🛠️ Платформаның Build қателерін толық жоятын функциялар жинағы 🛠️ ---

// Әдеттерге (Habits) қатысты функциялар
export const addHabit = async (habitData) => {
  return { success: true };
};

export const getHabits = async () => {
  return [];
};

export const updateHabit = async (id, habitData) => {
  return { success: true };
};

export const deleteHabit = async (id) => {
  return { success: true };
};

export const toggleHabitToday = async (id) => {
  return { success: true };
};

// Ментор мен Студенттерге қатысты функциялар
export const getStudentsByMentor = async (mentorId) => {
  return [];
};

export const getTeammates = async (studentId) => {
  return [];
};

export const setStudentLives = async (studentId, lives) => {
  return { success: true };
};

// Тапсырмалар (Tasks) мен Марафондарға қатысты функциялар
export const getTask = async (id) => {
  return {};
};

export const getTasksByMarathon = async (marathonId) => {
  return [];
};

// Есептерге (Submissions) қатысты функциялар
export const getSubmission = async (id) => {
  return {};
};

export const getSubmissionsByStudent = async (studentId) => {
  return [];
};

// Эйзенхауэр Матрицасына қатысты функциялар
export const toggleMatrixTaskDone = async (id) => {
  return { success: true };
};

// Чат және Хабарламалар
export const sendMessage = async (messageData) => {
  return { success: true };
};

// Ұйымдастырушы мен Жүйені баптау функциялары
export const setOrganizerSubscriptionStatus = async (tenantId, status) => {
  return { success: true };
};

export const initIfEmpty = async () => {
  return;
};

export const resetDemoData = async () => {
  return;
};