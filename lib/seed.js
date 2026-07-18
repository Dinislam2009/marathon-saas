import { generateId } from "./id";
import { getTodayDayNumber } from "./utils";
import {
  SUBSCRIPTION_STATUS,
  MARATHON_STATUS,
  STUDENT_STATUS,
  SUBMISSION_STATUS,
  VERIFICATION_TYPE,
  TASK_STATUS,
  DEFAULT_DURATION_DAYS,
  POINTS_PER_COMPLETED_DAY,
} from "./constants";

// Everything below is DEMO content only, generated fresh (relative to
// today's date) the first time the app runs in a browser that has no
// marathon-saas:* keys in localStorage yet. See lib/data.js -> initIfEmpty().

const DAY_THEMES = [
  "Постановка цели и планирование",
  "Утренняя рутина",
  "Физическая активность",
  "Тайм-менеджмент",
  "Дыхание и отдых",
  "Пищевые привычки",
  "Итоги дня и рефлексия",
];

function isoDaysFromNow(offsetDays) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function buildOrganizers() {
  return [
    {
      id: "org_tabys",
      name: "Марафон «Табыс»",
      ownerName: "Айгерим Сатбаева",
      email: "aigerim@tabys-marathon.kz",
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
      subscriptionPlan: "Стандарт",
      monthlyFee: 49900,
      nextPaymentDate: isoDaysFromNow(19),
      createdAt: isoDaysFromNow(-64),
    },
    {
      id: "org_dene",
      name: "Клуб физической подготовки",
      ownerName: "Ерлан Касымов",
      email: "erlan@denesport.kz",
      subscriptionStatus: SUBSCRIPTION_STATUS.TRIAL,
      subscriptionPlan: "Пробный период",
      monthlyFee: 0,
      nextPaymentDate: isoDaysFromNow(5),
      createdAt: isoDaysFromNow(-9),
    },
    {
      id: "org_til",
      name: "Марафон изучения языка",
      ownerName: "Мадина Джумабекова",
      email: "madina@tilmarathon.kz",
      subscriptionStatus: SUBSCRIPTION_STATUS.BLOCKED,
      subscriptionPlan: "Старт",
      monthlyFee: 29900,
      nextPaymentDate: isoDaysFromNow(-6),
      createdAt: isoDaysFromNow(-120),
    },
  ];
}

function buildMarathon() {
  const START_OFFSET_DAYS = -4; // marathon began 4 days ago -> "today" is day 5
  return {
    id: "marathon_1",
    orgId: "org_tabys",
    title: "21-дневный марафон дисциплины",
    description:
      "Марафон на 21 день, помогающий выработать новую привычку через маленькие ежедневные шаги.",
    durationDays: DEFAULT_DURATION_DAYS,
    startDate: isoDaysFromNow(START_OFFSET_DAYS),
    status: MARATHON_STATUS.ACTIVE,
    createdAt: isoDaysFromNow(START_OFFSET_DAYS - 3),
  };
}

function buildTasks(marathon) {
  return Array.from({ length: marathon.durationDays }, (_, i) => {
    const dayNumber = i + 1;
    const theme = DAY_THEMES[i % DAY_THEMES.length];
    return {
      id: generateId("task"),
      marathonId: marathon.id,
      dayNumber,
      title: `День ${dayNumber}: ${theme}`,
      videoUrl: "https://youtu.be/dQw4w9WgXcQ",
      content: `Сегодняшнее задание посвящено теме «${theme}». Посмотрите видео и выполните задание ниже.`,
      verificationType:
        dayNumber % 2 === 0 ? VERIFICATION_TYPE.SCREENSHOT : VERIFICATION_TYPE.TEST,
      status: TASK_STATUS.PUBLISHED,
      createdAt: marathon.createdAt,
    };
  });
}

function buildMentors() {
  return [
    {
      id: "mentor_1",
      orgId: "org_tabys",
      name: "Асхат Дуйсенов",
      email: "askhat@tabys-marathon.kz",
      phone: "+7 (701) 234-56-78",
      createdAt: isoDaysFromNow(-30),
    },
    {
      id: "mentor_2",
      orgId: "org_tabys",
      name: "Гульнур Сарсенова",
      email: "gulnur@tabys-marathon.kz",
      phone: "+7 (702) 345-67-89",
      createdAt: isoDaysFromNow(-25),
    },
  ];
}

function buildStudentsAndSubmissions(marathon) {
  const todayDay = getTodayDayNumber(marathon) ?? 1;
  const pastDays = Math.max(todayDay - 1, 0);

  // name + how many of the past days each student missed (for realistic
  // completion-rate/streak variety — no life penalty attached anymore)
  const plan = [
    { name: "Алуа Ниязбекова", missed: 0 },
    { name: "Аида Токтарова", missed: 0 },
    { name: "Нурлан Абенов", missed: 1 },
    { name: "Дана Серикова", missed: 2 },
    { name: "Санжар Оспанов", missed: 0 },
    { name: "Ерлан Муканов", missed: 3 },
  ];

  const students = [];
  const submissions = [];

  plan.forEach(({ name, missed: missedCount }, idx) => {
    const studentId = generateId("student");
    const missedDays = new Set(
      Array.from({ length: Math.min(missedCount, pastDays) }, (_, i) => i + 1)
    );

    let points = 0;
    for (let day = 1; day <= pastDays; day++) {
      const missed = missedDays.has(day);
      if (!missed) points += POINTS_PER_COMPLETED_DAY;
      submissions.push({
        id: generateId("sub"),
        studentId,
        marathonId: marathon.id,
        dayNumber: day,
        status: missed ? SUBMISSION_STATUS.MISSED : SUBMISSION_STATUS.SUBMITTED,
        checklist: missed
          ? { routine: false, video: false, homework: false }
          : { routine: true, video: true, homework: true },
        submittedAt: missed ? null : isoDaysFromNow(day - todayDay),
      });
    }

    // Today always starts as a genuinely-open checklist.
    if (todayDay >= 1 && todayDay <= marathon.durationDays) {
      submissions.push({
        id: generateId("sub"),
        studentId,
        marathonId: marathon.id,
        dayNumber: todayDay,
        status: SUBMISSION_STATUS.PENDING,
        checklist: { routine: false, video: false, homework: false },
        submittedAt: null,
      });
    }

    students.push({
      id: studentId,
      orgId: "org_tabys",
      marathonId: marathon.id,
      mentorId: idx % 2 === 0 ? "mentor_1" : "mentor_2",
      name,
      email: `student${idx + 1}@example.kz`,
      points,
      status: STUDENT_STATUS.ACTIVE,
      joinedAt: marathon.createdAt,
    });
  });

  return { students, submissions };
}

export function buildSeedData() {
  const organizers = buildOrganizers();
  const mentors = buildMentors();
  const marathon = buildMarathon();
  const tasks = buildTasks(marathon);
  const { students, submissions } = buildStudentsAndSubmissions(marathon);

  return {
    organizers,
    mentors,
    marathons: [marathon],
    tasks,
    students,
    submissions,
  };
}
