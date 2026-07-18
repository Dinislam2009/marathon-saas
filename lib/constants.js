// Central place for every enum + Russian display label used across the app.
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
  [SUBSCRIPTION_STATUS.TRIAL]: "Пробный период",
  [SUBSCRIPTION_STATUS.ACTIVE]: "Активен",
  [SUBSCRIPTION_STATUS.BLOCKED]: "Заблокирован",
};

export const MARATHON_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
};

export const MARATHON_STATUS_LABELS = {
  [MARATHON_STATUS.DRAFT]: "Черновик",
  [MARATHON_STATUS.ACTIVE]: "Активен",
  [MARATHON_STATUS.COMPLETED]: "Завершён",
};

export const STUDENT_STATUS = {
  ACTIVE: "active",
  BLOCKED: "blocked",
};

export const SUBMISSION_STATUS = {
  PENDING: "pending", // day hasn't been marked done yet, deadline not passed
  SUBMITTED: "submitted", // student completed + submitted on time
  MISSED: "missed", // deadline passed, nothing submitted
};

export const VERIFICATION_TYPE = {
  TEST: "test",
  SCREENSHOT: "screenshot",
};

export const VERIFICATION_TYPE_LABELS = {
  [VERIFICATION_TYPE.TEST]: "Тест",
  [VERIFICATION_TYPE.SCREENSHOT]: "Скриншот",
};

export const TASK_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
};

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.DRAFT]: "Черновик",
  [TASK_STATUS.SCHEDULED]: "Запланировано",
  [TASK_STATUS.PUBLISHED]: "Опубликовано",
};

export const TASK_STATUS_TONE = {
  [TASK_STATUS.DRAFT]: "neutral",
  [TASK_STATUS.SCHEDULED]: "info",
  [TASK_STATUS.PUBLISHED]: "steppe",
};

// Homework review workflow (mentor-only)
export const REVIEW_STATUS = {
  PENDING: "pending", // Ожидают проверки
  REWORK: "rework", // На доработке
  APPROVED: "approved", // Проверено
};

export const REVIEW_STATUS_LABELS = {
  [REVIEW_STATUS.PENDING]: "Ожидают проверки",
  [REVIEW_STATUS.REWORK]: "На доработке",
  [REVIEW_STATUS.APPROVED]: "Проверено",
};

export const REVIEW_STATUS_TONE = {
  [REVIEW_STATUS.PENDING]: "info",
  [REVIEW_STATUS.REWORK]: "ember",
  [REVIEW_STATUS.APPROVED]: "steppe",
};

// --- Marathon defaults ---
export const DEFAULT_DURATION_DAYS = 21;
export const DEADLINE_HOUR = 23; // 23:00 local time — see lib/utils.js isPastDeadline()
export const POINTS_PER_COMPLETED_DAY = 10;
export const STRUGGLING_THRESHOLD_DAYS = 3; // consecutive inactive days -> "struggling" flag

// The 3 checklist items shown on the student's daily home screen.
// `key` must stay stable — it's what gets persisted in a submission's
// `checklist` object in localStorage.
export const DAILY_CHECKLIST_ITEMS = [
  { key: "routine", label: "Подъём / Спорт" },
  { key: "video", label: "Просмотр видео" },
  { key: "homework", label: "Сдача домашнего задания" },
];

// --- Student-side features: Groups, Materials, Countdown, Habits, Matrix, Chat ---
export const MATRIX_QUADRANTS = [
  { key: "urgent-important", urgent: true, important: true, label: "Срочно и важно", tone: "ember" },
  { key: "not_urgent-important", urgent: false, important: true, label: "Важно, не срочно", tone: "steppe" },
  { key: "urgent-not_important", urgent: true, important: false, label: "Срочно, не важно", tone: "horizon" },
  { key: "not_urgent-not_important", urgent: false, important: false, label: "Не срочно и не важно", tone: "neutral" },
];
