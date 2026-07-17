# Marathon SaaS — Phase 1

Марафон/интенсивтер ұйымдастыруға арналған көпқолданушылы (multi-tenant)
SaaS платформасының алғашқы кезеңі: архитектура, папка құрылымы және 3
негізгі интерфейстің жұмыс істейтін UI қаңқасы.

## Стек

- **Next.js 16** (App Router, Turbopack, async `params`)
- **React 19**
- **Tailwind CSS v4** (CSS-first `@theme`, `tailwind.config.js` керек емес)
- **localStorage** — Phase 1 деректер қабаты (төменде қараңыз)
- **lucide-react** — иконкалар

## Іске қосу

```bash
npm install
npm run dev
```

`http://localhost:3000` — рөл таңдау беті (демо, нақты авторизация жоқ).

Node.js **20.9+** керек (ұсынылады: 22 LTS).

## Неге localStorage?

Phase 1-дің мақсаты — UI мен бизнес-логиканы (жандар/lives, дедлайн,
рейтинг, tenant-оқшаулау) тексеру, backend-ке тәуелді болмай. Сондықтан
бүкіл дерекке қатынас **бір ғана файл** — `lib/data.js` — арқылы өтеді.

```
Компонент → context/DataContext.js → lib/data.js → lib/storage.js → localStorage
```

Phase 2-де тек `lib/storage.js` мен `lib/data.js`-тің ішін ауыстыру
жеткілікті (Firebase Firestore немесе PostgreSQL/Prisma шақыруларына) —
функциялардың аты мен параметрлері бірдей қалады, сондықтан компоненттер
мен `DataContext`-ті қайта жазудың қажеті жоқ. Әр функцияның үстінде осы
туралы түсініктеме бар.

## Папка құрылымы

```
app/
  layout.js               # Fonts + DataProvider
  page.js                 # Демо рөл таңдау беті
  globals.css             # Tailwind v4 @theme токендері

  super-admin/
    layout.js / page.js   # Ұйымдастырушыларды қосу/бұғаттау, MRR

  org/[orgId]/
    admin/
      layout.js / page.js               # Марафон тізімі
      marathons/new/page.js             # Марафон құру формасы
      marathons/[marathonId]/page.js    # 21 күндік тапсырма редакторы
      marathons/[marathonId]/students/  # Оқушылар + жандарды реттеу

    student/
      layout.js                # Демо оқушы ауыстырғыш
      page.js                  # Күнделікті жоспар (чек-лист)
      progress/page.js         # 21 күндік прогресс тор
      leaderboard/page.js      # Рейтинг

components/ui/           # Button, Card, Badge, LivesBadge,
                          # ProgressGrid (signature), DashboardShell

lib/
  constants.js            # Enum-дар + қазақша лейблдар (бір орталық жер)
  storage.js              # localStorage төменгі деңгей — Phase 2-де осы ауысады
  data.js                 # CRUD + tenant-оқшаулау + "жан" қозғалтқышы
  seed.js                 # Демо деректер (ұйым, марафон, 6 оқушы)
  utils.js                # Дедлайн/күн есептеулері, cn()
  id.js                   # crypto.randomUUID() орамасы

context/
  DataContext.js          # React state ↔ lib/data.js көпірі
```

## Негізгі логика шешімдері

**Tenant-оқшаулау (isolation).** Барлық URL `/org/[orgId]/...` түрінде,
әр `lib/data.js` функциясы `orgId`/`marathonId` бойынша сүзеді. Бірақ бұл
клиент жақтағы сүзгі ғана — нақты қауіпсіздік Phase 2-де Firestore
Security Rules немесе Postgres Row-Level Security арқылы серверде
қайталануы **міндетті**.

**Жан (life) қозғалтқышы.** `lib/data.js`-тегі `checkMissedDeadlines()`
әр белсенді марафон бойынша өткен күндерді тексеріп, 23:00 дедлайннан
кейін де "pending" қалған тапсырманы "missed" деп белгілейді және 1 жан
кемітеді. Бұл функция қосымша ашылғанда және әр 60 секунд сайын
(`DataContext.js`) шақырылады. **Ескерту:** нақты өнімде бұл серверде
cron/scheduled function түрінде жұмыс істеуі керек — қолданушы қосымшаны
ашпаса, клиент жақтағы тексеру ешқашан іске қоспайды.

**Ұпай/рейтинг.** Күннің барлық 3 чек-лист итемі белгіленген сәтте
`SUBMITTED` статусы қойылып, оқушыға 10 ұпай қосылады (`lib/constants.js`
→ `POINTS_PER_COMPLETED_DAY`). Рейтинг осы ұпай бойынша сұрыпталады.

## Дизайн жүйесі

"Steppe dawn" палитрасы — cream+terracotta немесе dark+neon сияқты
әдепкі AI-дизайн клишелерінен қашықтап, марафон/челлендж өніміне сай
жылы әрі энергиялы реңк үшін таңдалды.

| Token | Hex | Мағынасы |
|---|---|---|
| `paper` | `#FAF8F4` | Негізгі фон |
| `ink` | `#211C17` | Мәтін |
| `horizon` | `#EA7C2C` | Негізгі акцент (CTA, "бүгін") |
| `steppe` | `#3D7A63` | Орындалды / оң күй |
| `ember` | `#C4432E` | Өткізіп алды / қате |
| `dusk` | `#1B2430` | Super Admin sidebar |

Шрифттер: **Unbounded** (display, күн саны/тор үшін) + **Golos Text**
(негізгі мәтін) — екеуі де Google Fonts, толық кирилл/қазақ әрпін
(Ә Ғ Қ Ң Ө Ұ Ү Һ І) қолдайды.

Сигнатуралық элемент — `components/ui/ProgressGrid.jsx`: GitHub
contribution graph мен әдет-трекерін біріктірген 21 күндік тор.

## Белгілі шектеулер (Phase 1)

- Нақты авторизация жоқ — бас беттегі рөл таңдау + оқушы ауыстырғыш
  соның орнын алмастырып тұр.
- Файл жүктеу (скриншот) тек UI-қалып күйінде — Phase 2-де Firebase
  Storage/S3 қосылады.
- Бір оқушы бір марафонға ғана тіркелген деп есептелген (демо үшін
  жеткілікті, бірақ `students` кестесінде көп-марафон схемасы да
  оңай қосылады).

## Кезекті қадамдар (Phase 2 ұсынысы)

1. Auth: NextAuth.js / Firebase Auth / Clerk — рөлге қарай маршрутты қорғау.
2. `lib/storage.js` → Firestore немесе Prisma + PostgreSQL.
3. `checkMissedDeadlines()` → Vercel Cron / Firebase Scheduled Function.
4. Файл жүктеу: Firebase Storage немесе S3-uyымtас presigned URL.
5. Ұйымдастырушыға төлем: Stripe/Kaspi/CloudPayments вебхуктары арқылы
   `subscriptionStatus`-ты автоматты жаңарту.
