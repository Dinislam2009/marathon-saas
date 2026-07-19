"use client";

import { useEffect, useState } from "react";
import { Flame, PlayCircle, Lock, ExternalLink, Check } from "lucide-react";
import { useData } from "@/context/DataContext";
import { DAILY_CHECKLIST_ITEMS, STUDENT_STATUS, SUBMISSION_STATUS } from "@/lib/constants";
import { getTodayDayNumber, cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import LoadingState from "@/components/ui/LoadingState";

// --- ⚡ СЕРВЕРЛІК ACTION ИМПОРТТАУ (БАЗА ИМПОРТЫ ТОЛЫҚ ТАЗАЛАНДЫ) ---
import { getStudentDashboardAction } from "@/app/actions";

function computeStreak(submissions, todayDay) {
  if (!submissions) return 0;
  let streak = 0;
  for (let day = todayDay - 1; day >= 1; day--) {
    const s = submissions.find((x) => x.dayNumber === day);
    if (s?.status === SUBMISSION_STATUS.SUBMITTED) streak++;
    else break;
  }
  return streak;
}

export default function StudentHomePage() {
  const { ready, tick, currentStudentId, updateChecklist } = useData();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  // Деректерді серверден қауіпсіз, бір жиынтықпен оқу
  useEffect(() => {
    if (!ready || !currentStudentId) return;

    async function loadDashboard() {
      try {
        const res = await getStudentDashboardAction(currentStudentId);
        if (res && res.ok) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error("Dashboard оқу қатесі:", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadDashboard();
  }, [ready, currentStudentId, refreshTick, tick]);

  if (!ready || !currentStudentId || loadingData || !dashboardData) return <LoadingState />;

  const { student, marathon, task, submission, allSubmissions } = dashboardData;

  if (!student || !marathon) return <LoadingState />;

  const todayDay = getTodayDayNumber(marathon);

  if (student.status === STUDENT_STATUS.BLOCKED) {
    return (
      <Card className="text-center py-14">
        <Lock size={28} className="mx-auto text-ember mb-4" />
        <h1 className="font-display text-xl font-semibold text-ink mb-2">Аккаунт бұғатталған</h1>
        <p className="text-mist text-sm">Барлық жандарың бітті. Ұйымдастырушыға хабарласыңыз.</p>
      </Card>
    );
  }

  if (!todayDay) {
    return (
      <Card className="text-center py-14">
        <p className="text-mist">Марафон әлі басталған жоқ. Ертерек қайта кел!</p>
      </Card>
    );
  }

  const checklist = submission?.checklist || { routine: false, video: false, homework: false };
  const locked = submission && submission.status !== SUBMISSION_STATUS.PENDING;
  const doneCount = Object.values(checklist).filter(Boolean).length;
  const percent = Math.round((doneCount / DAILY_CHECKLIST_ITEMS.length) * 100);
  const streak = computeStreak(allSubmissions, todayDay);

  async function toggle(key) {
    if (locked) return;
    await updateChecklist(student.id, marathon.id, todayDay, { [key]: !checklist[key] });
    setRefreshTick((prev) => prev + 1); // Деректерді қайта синхрондау
  }

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-mist font-bold uppercase tracking-wider">Жұмыс кеңістігі</p>
          <h1 className="font-display text-2xl font-extrabold text-horizon-dark tracking-tight">LOOPIT</h1>
        </div>
        <div className="flex items-center gap-1 bg-horizon/10 border border-horizon/20 px-3 py-1.5 rounded-full">
          <Flame size={16} className="text-horizon" />
          <span className="text-sm font-bold text-horizon-dark">{streak} күн</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-horizon to-horizon-dark p-5 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <p className="font-bold text-xs tracking-wider uppercase opacity-90 mb-2">
          Марафон «{marathon.title}» • {todayDay}-күн
        </p>
        <p className="text-sm leading-relaxed text-white/85 font-medium">
          Тапсырмаларды уақытында орында, дедлайнға дейін белгіле — жаныңды сақта!
        </p>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-mist uppercase tracking-wider">Бүгінгі прогресс</span>
          <span className="text-xs font-bold text-steppe bg-steppe-light px-2.5 py-1 rounded-full">
            {percent}% орындалды
          </span>
        </div>
        <div className="w-full h-2.5 bg-paper-dim rounded-full overflow-hidden">
          <div className="h-full bg-steppe rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </Card>

      {task && (
        <Card className="flex items-start gap-3">
          <PlayCircle size={20} className="text-horizon-dark shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-ink text-sm">{task.title}</p>
            {task.videoUrl && (
              <a
                href={task.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-horizon-dark font-medium mt-2"
              >
                Бейнесабақты көру <ExternalLink size={12} />
              </a>
            )}
          </div>
        </Card>
      )}

      <div>
        <h3 className="text-xs font-extrabold text-mist uppercase tracking-wider mb-3">
          Бүгінгі тапсырмалар
        </h3>
        <div className="flex flex-col gap-3">
          {DAILY_CHECKLIST_ITEMS.map((item) => {
            const done = checklist[item.key];
            return (
              <Card key={item.key} padded className="flex items-center justify-between !p-4">
                <span className="text-sm font-bold text-ink">{item.label}</span>
                <button
                  onClick={() => toggle(item.key)}
                  disabled={locked}
                  className={cn(
                    "text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shrink-0 ml-3",
                    done
                      ? "bg-steppe-light text-steppe"
                      : "bg-horizon text-white hover:bg-horizon-dark",
                    locked && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {done ? (
                    <span className="inline-flex items-center gap-1">
                      <Check size={12} strokeWidth={3} /> Сдано
                    </span>
                  ) : (
                    "Белгілеу"
                  )}
                </button>
              </Card>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-mist text-center">
        Дедлайн: бүгін 23:00-ге дейін. Уақытында белгілемесең — 1 жаның күйеді.
      </p>
    </div>
  );
}