import { generateId } from "./id";
import { getTodayDayNumber } from "./utils";
import {
  SUBSCRIPTION_STATUS,
  MARATHON_STATUS,
  STUDENT_STATUS,
  SUBMISSION_STATUS,
  VERIFICATION_TYPE,
  DEFAULT_DURATION_DAYS,
  DEFAULT_LIVES,
  POINTS_PER_COMPLETED_DAY,
} from "./constants";

// Everything below is DEMO content only, generated fresh (relative to
// today's date) the first time the app runs in a browser that has no
// marathon-saas:* keys in localStorage yet. See lib/data.js -> initIfEmpty().

const DAY_THEMES = [
  "Мақсат қою және жоспарлау",
  "Таңғы рутина құру",
  "Дене белсенділігі",
  "Уақытты басқару",
  "Тыныс алу және демалыс",
  "Қоректену әдеттері",
  "Күн қорытындысы және рефлексия",
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
      name: "Табыс марафоны",
      ownerName: "Айгерім Сәтбаева",
      email: "aigerim@tabys-marathon.kz",
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
      subscriptionPlan: "Стандарт",
      monthlyFee: 49900,
      nextPaymentDate: isoDaysFromNow(19),
      createdAt: isoDaysFromNow(-64),
    },
    {
      id: "org_dene",
      name: "Дене шынықтыру клубы",
      ownerName: "Ерлан Қасымов",
      email: "erlan@denesport.kz",
      subscriptionStatus: SUBSCRIPTION_STATUS.TRIAL,
      subscriptionPlan: "Сынақ мерзімі",
      monthlyFee: 0,
      nextPaymentDate: isoDaysFromNow(5),
      createdAt: isoDaysFromNow(-9),
    },
    {
      id: "org_til",
      name: "Тіл үйрену марафоны",
      ownerName: "Мадина Жұмабекова",
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
    title: "21 күндік дисциплина марафоны",
    description:
      "Күн сайынғы кіші қадамдар арқылы жаңа әдетке үйренетін 21 күндік марафон.",
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
      title: `${dayNumber}-күн: ${theme}`,
      videoUrl: "https://youtu.be/dQw4w9WgXcQ",
      content: `Бүгінгі тапсырма «${theme}» тақырыбына арналған. Бейнесабақты көріп, төмендегі тапсырманы орындаңыз.`,
      verificationType:
        dayNumber % 2 === 0 ? VERIFICATION_TYPE.SCREENSHOT : VERIFICATION_TYPE.TEST,
      createdAt: marathon.createdAt,
    };
  });
}

function buildMentors() {
  return [
    {
      id: "mentor_1",
      orgId: "org_tabys",
      name: "Асхат Дүйсенов",
      email: "asqat@tabys-marathon.kz",
      phone: "+7 (701) 234-56-78",
      createdAt: isoDaysFromNow(-30),
    },
    {
      id: "mentor_2",
      orgId: "org_tabys",
      name: "Гүлнұр Сәрсенова",
      email: "gulnur@tabys-marathon.kz",
      phone: "+7 (702) 345-67-89",
      createdAt: isoDaysFromNow(-25),
    },
  ];
}

function buildStudentsAndSubmissions(marathon) {
  const todayDay = getTodayDayNumber(marathon) ?? 1;
  const pastDays = Math.max(todayDay - 1, 0);

  // name + how many of the past days each student missed
  const plan = [
    { name: "Алуа Ниязбекова", livesLost: 0 },
    { name: "Аида Тоқтарова", livesLost: 0 },
    { name: "Нұрлан Әбенов", livesLost: 1 },
    { name: "Дана Серікова", livesLost: 2 },
    { name: "Санжар Оспанов", livesLost: 0 },
    { name: "Ерлан Мұқанов", livesLost: 3 },
  ];

  const students = [];
  const submissions = [];

  plan.forEach(({ name, livesLost }, idx) => {
    const studentId = generateId("student");
    const lives = Math.max(DEFAULT_LIVES - livesLost, 0);
    const missedDays = new Set(
      Array.from({ length: Math.min(livesLost, pastDays) }, (_, i) => i + 1)
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
      lives,
      points,
      status: lives > 0 ? STUDENT_STATUS.ACTIVE : STUDENT_STATUS.BLOCKED,
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
