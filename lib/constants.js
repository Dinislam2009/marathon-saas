// Central place for every enum + Russian display label used across the app.
// Normalized to match Prisma UPPERCASE enum values perfectly.

export const ROLES = {
  OWNER: "OWNER",
  ORGANIZER: "ORGANIZER",
  CURATOR: "CURATOR",
  PARTICIPANT: "PARTICIPANT",
};

export const INVITATION_ROLE = {
  STUDENT: "STUDENT",
  MENTOR: "MENTOR",
};

export const INVITE_STATUS = {
  PENDING: "PENDING",
  CLAIMED: "CLAIMED",
};

export const SUBSCRIPTION_STATUS = {
  TRIAL: "TRIAL",
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
};

export const SUBSCRIPTION_STATUS_LABELS = {
  [SUBSCRIPTION_STATUS.TRIAL]: "Пробный период",
  [SUBSCRIPTION_STATUS.ACTIVE]: "Активен",
  [SUBSCRIPTION_STATUS.BLOCKED]: "Заблокирован",
};

export const MARATHON_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
};

export const MARATHON_STATUS_LABELS = {
  [MARATHON_STATUS.DRAFT]: "Черновик",
  [MARATHON_STATUS.ACTIVE]: "Активен",
  [MARATHON_STATUS.COMPLETED]: "Завершён",
};

export const STUDENT_STATUS = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
};

export const SUBMISSION_STATUS = {
  PENDING: "PENDING",
  SUBMITTED: "SUBMITTED",
  MISSED: "MISSED",
};

export const VERIFICATION_TYPE = {
  TEST: "TEST",
  SCREENSHOT: "SCREENSHOT",
};

export const VERIFICATION_TYPE_LABELS = {
  [VERIFICATION_TYPE.TEST]: "Тест",
  [VERIFICATION_TYPE.SCREENSHOT]: "Скриншот",
};

export const TASK_STATUS = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
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

export const REVIEW_STATUS = {
  PENDING: "PENDING",
  REWORK: "REWORK",
  APPROVED: "APPROVED",
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
export const DEADLINE_HOUR = 23;
export const POINTS_PER_COMPLETED_DAY = 10;
export const STRUGGLING_THRESHOLD_DAYS = 3;

export const DAILY_CHECKLIST_ITEMS = [
  { key: "routine", label: "Подъём / Спорт" },
  { key: "video", label: "Просмотр видео" },
  { key: "homework", label: "Сдача домашнего задания" },
];

export const MATRIX_QUADRANTS = [
  { key: "urgent-important", urgent: true, important: true, label: "Срочно и важно", tone: "ember" },
  { key: "not_urgent-important", urgent: false, important: true, label: "Важно, не срочно", tone: "steppe" },
  { key: "urgent-not_important", urgent: true, important: false, label: "Срочно, не важно", tone: "horizon" },
  { key: "not_urgent-not_important", urgent: false, important: false, label: "Не срочно и не важно", tone: "neutral" },
];