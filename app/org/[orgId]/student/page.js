"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import { getStudentDashboardAction, updateChecklist } from "@/app/actions";
import { DAILY_CHECKLIST_ITEMS } from "@/lib/constants";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import YoutubeIcon from "@/components/ui/YoutubeIcon";
import { 
  Flame, 
  Check, 
  Lock, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  Calendar, 
  Clock,
  Bell,
  Video
} from "lucide-react";

export default function StudentDashboardPage({ params }) {
  // Next.js params
  const { orgId } = use(params);
  const router = useRouter();
  const { currentStudentId, setCurrentStudentId } = useData();

  // State
  const [loading, setLoading] = useState(true);
  const [updatingChecklist, setUpdatingChecklist] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [checklistState, setChecklistState] = useState({
    routine: false,
    video: false,
    homework: false,
  });

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getStudentDashboardAction(currentStudentId);

      if (res?.ok && res?.data) {
        setData(res.data);

        if (res.data.student?.id && res.data.student.id !== currentStudentId) {
          setCurrentStudentId(res.data.student.id);
        }

        if (res.data.submission?.checklist) {
          setChecklistState({
            routine: !!res.data.submission.checklist.routine,
            video: !!res.data.submission.checklist.video,
            homework: !!res.data.submission.checklist.homework,
          });
        }
      } else {
        setError(res?.error || "Деректер табылмады");
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError("Сервермен байланыс қатесі. Қайтадан байқап көріңіз.");
    } finally {
      setLoading(false);
    }
  }, [currentStudentId, setCurrentStudentId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate streak
  const calculateStreak = (allSubmissions) => {
    if (!allSubmissions || !Array.isArray(allSubmissions)) return 0;
    
    const sorted = [...allSubmissions].sort((a, b) => b.dayNumber - a.dayNumber);
    let streak = 0;

    for (const sub of sorted) {
      if (sub.status === "SUBMITTED") {
        streak++;
      } else if (sub.status === "MISSED") {
        break;
      }
    }
    return streak;
  };

  // Checklist toggle handler
  const handleToggleChecklist = async (itemKey) => {
    if (!data?.student || !data?.marathon) return;
    
    const isLocked = data.submission && data.submission.status !== "PENDING";
    if (isLocked || updatingChecklist) return;

    const newValue = !checklistState[itemKey];
    
    const updatedChecklist = { ...checklistState, [itemKey]: newValue };
    setChecklistState(updatedChecklist);
    setUpdatingChecklist(true);

    try {
      const dayNum = data.task?.dayNumber || 1;
      const res = await updateChecklist(
        data.student.id,
        data.marathon.id,
        dayNum,
        { [itemKey]: newValue }
      );

      if (!res?.ok) {
        setChecklistState(checklistState);
      }
    } catch (err) {
      console.error("Failed to update checklist:", err);
      setChecklistState(checklistState);
    } finally {
      setUpdatingChecklist(false);
    }
  };

  // 1. LOADING STATE
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <LoadingState text="Жүктелуде..." />
      </div>
    );
  }

  // 2. ERROR STATE
  if (error && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-paper-dim flex items-center justify-center text-ember mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Жүктеу қатесі</h2>
        <p className="text-mist text-sm mb-6 max-w-sm">{error}</p>
        <Button onClick={fetchDashboardData} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Қайталау
        </Button>
      </div>
    );
  }

  const { student, marathon, task, submission, allSubmissions } = data || {};

  // 3. NOT FOUND STATE
  if (!student || !marathon) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-paper-dim flex items-center justify-center text-mist mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Деректер табылмады</h2>
        <p className="text-mist text-sm mb-6">
          Студент немесе марафон жүйеден табылмады.
        </p>
        <Button onClick={() => router.push("/start")}>
          /start бетіне оралу
        </Button>
      </div>
    );
  }

  // 4. BLOCKED STATE
  if (student.status === "BLOCKED") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-ember/10 flex items-center justify-center text-ember mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Аккаунт бұғатталған</h2>
        <p className="text-mist text-sm max-w-sm">
          Сіздің марафонға қатысу мүмкіндігіңіз шектелген. Ұйымдастырушымен байланысыңыз.
        </p>
      </div>
    );
  }

  // Calculated variables
  const streak = calculateStreak(allSubmissions);
  const totalItems = 3;
  const completedCount = Object.values(checklistState).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalItems) * 100);
  const isSubmissionLocked = submission && submission.status !== "PENDING";
  const dayNumber = task?.dayNumber || 1;
  const totalDays = marathon.totalDays || 30;

  return (
    <div className="w-full pb-12 px-2 sm:px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">

        {/* СОЛ ЖАҚ / НЕГІЗГІ КОНТЕНТ */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 w-full">

          {/* HERO CARD */}
          <div className="relative overflow-hidden bg-gradient-to-br from-horizon to-horizon-dark rounded-3xl p-6 md:p-8 text-white shadow-lg w-full">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20">
                  <Calendar className="w-3.5 h-3.5" />
                  Күн {dayNumber} / {totalDays}
                </span>

                <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                  <span>{streak} күн қатарынан</span>
                </div>
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
                  {marathon.title}
                </h1>
                <p className="text-white/80 text-sm md:text-base font-medium">
                  Мақсатыңа қарай алға ұмтыл! Әр күннің маңызы зор.
                </p>
              </div>
            </div>
          </div>

          {/* TODAY'S PROGRESS */}
          <Card className="p-6 w-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink">Күндік прогресс</h3>
                  <p className="text-xs text-mist">
                    Орындалды: {completedCount} / {totalItems}
                  </p>
                </div>
                <span className="text-xl font-black text-ink">{progressPercent}%</span>
              </div>

              <div className="w-full h-3 bg-paper-dim rounded-full overflow-hidden border border-mist-light">
                <div
                  className="h-full bg-steppe transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {isSubmissionLocked && (
                <div className="mt-3 p-3 rounded-xl bg-paper-dim border border-mist-light flex items-center gap-2 text-xs font-medium text-mist">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {submission.status === "SUBMITTED"
                      ? "Бүгінгі тапсырма сәтті жіберілді!"
                      : "Бүгінгі қабылдау уақыты аяқталды."}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* TODAY'S TASK CARD */}
          <Card className="p-6 space-y-4 w-full">
            {task ? (
              <>
                <div className="border-b border-mist-light pb-3">
                  <span className="text-xs font-semibold text-mist uppercase tracking-wider">
                    Күн тапсырмасы
                  </span>
                  <h2 className="text-xl font-bold text-ink mt-0.5">{task.title}</h2>
                </div>

                {task.description && (
                  <p className="text-ink/80 text-sm leading-relaxed whitespace-pre-line">
                    {task.description}
                  </p>
                )}

                {task.videoUrl && (
                  <a
                    href={task.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-paper-dim hover:bg-paper border border-mist-light text-ink text-sm font-medium transition-colors group"
                  >
                    <YoutubeIcon className="w-5 h-5 text-red-600 group-hover:scale-105 transition-transform" />
                    <span>Бейнесабақты қарау</span>
                    <ExternalLink className="w-4 h-4 text-mist ml-auto" />
                  </a>
                )}
              </>
            ) : (
              <div className="py-8 text-center space-y-2">
                <Clock className="w-10 h-10 text-mist mx-auto opacity-50" />
                <h3 className="text-base font-bold text-ink">
                  Бүгінгі тапсырма әлі дайын емес
                </h3>
                <p className="text-xs text-mist max-w-xs mx-auto">
                  Ұйымдастырушы жақында материалдарды жариялайды.
                </p>
              </div>
            )}
          </Card>

          {/* CHECKLIST */}
          <div className="space-y-3 w-full">
            <h3 className="text-base font-bold text-ink px-1">Күндік чек-лист</h3>

            <div className={`space-y-3 ${isSubmissionLocked ? "opacity-60 pointer-events-none" : ""}`}>
              {(DAILY_CHECKLIST_ITEMS || [
                { id: "routine", label: "Таңғы ритуал" },
                { id: "video", label: "Видеоматериалды көру" },
                { id: "homework", label: "Үй тапсырмасын орындау" },
              ]).map((item, index) => {
                const isChecked = !!checklistState[item.id];

                return (
                  <div
                    key={item.id ? item.id : `checklist-${index}`}
                    onClick={() => handleToggleChecklist(item.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      isChecked
                        ? "bg-steppe/10 border-steppe/30 text-ink"
                        : "bg-paper hover:bg-paper-dim border-mist-light text-ink"
                    }`}
                  >
                    <span className="text-sm font-medium pr-4">{item.label}</span>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                        isChecked
                          ? "bg-steppe border-steppe text-white"
                          : "border-mist-light bg-paper"
                      }`}
                    >
                      {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DEADLINE WARNING */}
          <div className="text-center py-2">
            <p className="text-xs text-mist flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Дедлайн: бүгін 23:00-ге дейін. Үлгермесеңіз — күн өткізілді болып саналады.
            </p>
          </div>

        </div>

        {/* ОҢ ЖАҚ ПАНЕЛЬ */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 w-full">

          {/* Стрик статистикасы */}
          <Card className="p-5 w-full">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-ember/10 text-ember flex items-center justify-center shrink-0">
                <Flame className="w-7 h-7 fill-ember" />
              </div>
              <div>
                <p className="text-2xl font-black text-ink leading-none">{streak} күн</p>
                <p className="text-xs text-mist mt-1">Қатарынан орындалған күндер</p>
              </div>
            </div>
          </Card>

          {/* Белсенділік күнтізбесі */}
          <Card className="p-5 space-y-4 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Flame className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-sm">Белсенділік күнтізбесі</h3>
                  <p className="text-xs text-mist">Тапсырманы күнде орында</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"].map((day, i) => {
                const currentDay = typeof dayNumber !== 'undefined' ? dayNumber : 1;

                return (
                  <div
                    key={`calendar-day-${i}`}
                    className={`py-2 rounded-xl text-xs flex flex-col items-center justify-center transition-all ${
                      i < currentDay - 1
                        ? "bg-horizon text-white font-medium"
                        : i === currentDay - 1
                        ? "bg-horizon/10 text-horizon border-2 border-horizon font-bold"
                        : "bg-paper-dim text-mist"
                    }`}
                  >
                    <span className="text-[10px] opacity-80">{day}</span>
                    <span className="text-sm font-bold">{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Хабарландырулар */}
          <Card className="p-5 space-y-4 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-horizon/10 text-horizon rounded-xl">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-ink text-sm">Хабарландырулар</h3>
              </div>
              <span className="text-[10px] bg-horizon/10 text-horizon px-2 py-0.5 rounded-full font-semibold">
                Жаңа
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-paper-dim border border-mist-light">
                <div className="flex items-start gap-2.5">
                  <Video className="w-4 h-4 text-horizon mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-ink">LIVE ZOOM Вебинар!</h4>
                    <p className="text-[11px] text-mist mt-1 leading-relaxed">
                      Сағат 20:00-де экспертпен онлайн кездесу болады.
                    </p>
                    <span className="text-[10px] text-mist/70 mt-2 block">1 сағат бұрын</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-paper-dim border border-mist-light">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-ink">Дедлайн жақындауда</h4>
                    <p className="text-[11px] text-mist mt-1 leading-relaxed">
                      Бүгінгі тапсырманы 23:00-ге дейін орындап үлгеріңіз.
                    </p>
                    <span className="text-[10px] text-mist/70 mt-2 block">3 сағат бұрын</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Марафон статистикасы */}
          <Card className="p-5 space-y-3 w-full">
            <h3 className="font-bold text-ink text-sm">Марафон статистикасы</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-paper-dim border border-mist-light">
                <p className="text-lg font-black text-ink">{dayNumber}/{totalDays}</p>
                <p className="text-[11px] text-mist mt-0.5">Өткен күндер</p>
              </div>
              <div className="p-3 rounded-2xl bg-paper-dim border border-mist-light">
                <p className="text-lg font-black text-ink">
                  {Array.isArray(allSubmissions)
                    ? allSubmissions.filter((s) => s.status === "SUBMITTED").length
                    : 0}
                </p>
                <p className="text-[11px] text-mist mt-0.5">Тапсырылған күн</p>
              </div>
            </div>
          </Card>

          {/* Мотивация */}
          <Card className="p-5 bg-gradient-to-br from-steppe/10 to-transparent border-steppe/20 w-full">
            <p className="text-sm font-medium text-ink italic leading-relaxed">
              «Табыстылық — бұл әр күнгі кішкентай қадамдардың жиынтығы.»
            </p>
            <p className="text-xs text-mist mt-2">Loopit жаттауы</p>
          </Card>

          {/* Топ рейтинг (қысқаша) */}
          <Card className="p-5 space-y-4 w-full">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-ink text-sm">Топ рейтинг</h3>
              <button
                onClick={() => router.push(`/org/${orgId}/rating`)}
                className="text-[11px] font-semibold text-horizon hover:underline"
              >
                Барлығы
              </button>
            </div>
            <div className="space-y-2.5">
              {(data?.leaderboard || []).slice(0, 3).map((person, i) => (
                <div
                  key={person.id || i}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-paper-dim border border-mist-light"
                >
                  <span className="w-6 h-6 rounded-full bg-horizon/10 text-horizon text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium text-ink truncate">
                    {person.name || "Қатысушы"}
                  </span>
                  <span className="ml-auto text-xs font-bold text-mist shrink-0">
                    {person.progress ?? 0}%
                  </span>
                </div>
              ))}
              {!data?.leaderboard?.length && (
                <p className="text-xs text-mist text-center py-2">
                  Рейтинг деректері әлі жоқ
                </p>
              )}
            </div>
          </Card>

          {/* Куратор */}
          <Card className="p-5 space-y-3 w-full">
            <h3 className="font-bold text-ink text-sm">Кураторыңыз</h3>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-horizon/10 text-horizon flex items-center justify-center font-bold text-sm shrink-0">
                {(data?.mentor?.name || "К")[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">
                  {data?.mentor?.name || "Куратор тағайындалмаған"}
                </p>
                <p className="text-xs text-mist truncate">
                  {data?.mentor?.role || "Сұрақ болса, чатқа жазыңыз"}
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push(`/org/${orgId}/chat`)}
              className="w-full text-sm"
            >
              Хабарласу
            </Button>
          </Card>

        </div>

      </div>
    </div>
  );
}