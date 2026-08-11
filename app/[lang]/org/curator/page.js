"use client";

import { use, useState, useEffect, useMemo } from "react";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Plus, 
  Sparkles,
  FileText,
  Calendar,
  Check,
  X,
  ChevronRight,
  Flag,
  Send
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { SUBMISSION_STATUS, MARATHON_STATUS, MARATHON_STATUS_LABELS } from "@/lib/constants";
import { getTodayDayNumber, formatDate } from "@/lib/utils";
import LoadingState from "@/components/LoadingState";
import Badge from "@/components/Badge";
import { useLanguage } from "@/context/LanguageContext";

// 1. Клиенттік деңгейде доводимость (орындалу пайызын) есептеу
function completionRate(student, marathon, allSubmissions = {}) {
  const todayDay = getTodayDayNumber(marathon) ?? 1;
  const possible = Math.max(todayDay - 1, 0);
  if (possible === 0) return 0;
  
  const studentSubmissions = Object.values(allSubmissions).filter(
    (s) => s.studentId === student.id
  );
  
  const submitted = studentSubmissions.filter(
    (s) => s.status === SUBMISSION_STATUS.SUBMITTED && s.dayNumber <= possible
  ).length;
  
  return Math.round((submitted / possible) * 100);
}

// 2. 30 күндік белсенділікті есептеу
function last30DaysActivity(students, allSubmissions = {}) {
  const counts = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
  days.forEach((d) => (counts[d] = 0));

  students.forEach((student) => {
    const studentSubmissions = Object.values(allSubmissions).filter(
      (s) => s.studentId === student.id
    );
    studentSubmissions.forEach((s) => {
      if (s.status === SUBMISSION_STATUS.SUBMITTED && s.submittedAt) {
        const key = new Date(s.submittedAt).toISOString().slice(0, 10);
        if (key in counts) counts[key]++;
      }
    });
  });
  return days.map((d) => ({ date: d, count: counts[d] }));
}

// 3. 30 Күндік Белсенділік Графигі
function ActivityChart({ data, isRu }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-28 pt-4 font-sans">
      {data.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count} ${isRu ? "заданий" : "тапсырма"}`}
          className="flex-1 bg-purple-200 hover:bg-purple-600 rounded-t transition-all cursor-pointer group relative"
          style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 12 : 4)}%` }}
        >
          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs pointer-events-none whitespace-nowrap z-20">
            {d.count} {isRu ? "отчётов" : "есеп"}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function curatorDashboardPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const { orgId } = use(params);
  const { ready, state } = useData();
  const [activeTab, setActiveTab] = useState("pending");

  // 1. Алдымен Кураторлар тізімін анықтаймыз
  const curators = useMemo(() => {
    if (!ready || !state?.curators) return [];
    return Object.values(state.curators).filter((m) => m.orgId === orgId);
  }, [ready, state?.curators, orgId]);

  // 2. куратор анықталған соң ID-ді аламыз
  const curatorId = curators[0]?.id || "";

  // Ағымдағы кураторға бекітілген оқушылар
  const students = useMemo(() => {
    if (!curatorId || !state?.students) return [];
    return Object.values(state.students).filter((s) => s.curatorId === curatorId);
  }, [curatorId, state?.students]);

  // Марафондар тізімі
  const marathons = useMemo(() => {
    if (!ready || !state?.marathons) return [];
    return Object.values(state.marathons).filter((m) => m.orgId === orgId);
  }, [ready, state?.marathons, orgId]);

  // Есептер (Submissions) тізімі
  const submissionsList = useMemo(() => {
    if (!ready || !state?.submissions || !students.length) return [];
    const studentIds = new Set(students.map((s) => s.id));
    return Object.values(state.submissions).filter((s) => studentIds.has(s.studentId));
  }, [ready, state?.submissions, students]);

  // Қауіпті аймақтағы оқушылар (Үлгерімі 50%-дан төмен)
  const atRiskStudents = useMemo(() => {
    return students.filter((s) => {
      const marathon = state?.marathons?.[s.marathonId] || {};
      const rate = completionRate(s, marathon, state?.submissions || {});
      return rate < 50;
    });
  }, [students, state]);

  if (!ready) return <LoadingState />;

  const activeMarathons = marathons.filter((m) => m.status === MARATHON_STATUS.ACTIVE);
  const currentcurator = curators.find((m) => m.id === curatorId);

  const avgCompletion = students.length
    ? Math.round(
        students.reduce((sum, s) => {
          const marathon = state?.marathons?.[s.marathonId] || {};
          return sum + completionRate(s, marathon, state?.submissions || {});
        }, 0) / students.length
      )
    : 0;

  const activity = last30DaysActivity(students, state?.submissions || {});
  const pendingSubmissions = submissionsList.filter((s) => s.status === "PENDING" || s.status === SUBMISSION_STATUS.PENDING);

  return (
    <div className="w-full pb-10 space-y-8 font-sans text-slate-900">
      
      {/* 1. БЕЙНЕ куратор БАННЕРІ / WELCOME HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 rounded-3xl p-6 md:p-8 text-white shadow-xl space-y-4">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md text-purple-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> {isRu ? "Кабинет главного куратора" : "Бас Куратор Кабинеті"}
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-2">
              {isRu ? "Привет," : "Сәлем,"} {currentcurator?.name || (isRu ? "Куратор" : "Куратор")}! 👋
            </h1>
            <p className="text-purple-100 text-xs sm:text-sm font-medium mt-1">
              {isRu ? "Ожидают проверки " : "Тексеруді күтіп тұрған "}
              <span className="font-extrabold text-amber-300">
                {pendingSubmissions.length} {isRu ? "отчётов" : "есеп"}
              </span>.
            </p>
          </div>
        </div>
      </div>

      {/* 2. БАСҚАРУ МЕТРИКАЛАРЫ (KEY METRICS GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* КАРТОЧКА 1: Тексерілетін есептер */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-3 relative overflow-hidden group hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
              {isRu ? "На проверке" : "Тексеруде"}
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900">
              {pendingSubmissions.length} {isRu ? "отчётов" : "есеп"}
            </h3>
            <p className="text-[11px] text-amber-600 font-bold mt-0.5">
              {isRu ? "Требуют срочной проверки" : "Шұғыл тексеруді талап етеді"}
            </p>
          </div>
        </div>

        {/* КАРТОЧКА 2: Жалпы оқушылар */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-3 relative overflow-hidden group hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
              {isRu ? "Ученики" : "Оқушылар"}
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900">
              {students.length} {isRu ? "студентов" : "студент"}
            </h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
              {isRu ? "Закреплённая группа" : "Бекітілген белсенді топ"}
            </p>
          </div>
        </div>

        {/* КАРТОЧКА 3: Орташа доводимость */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-3 relative overflow-hidden group hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
              {isRu ? "Средняя успеваемость" : "Орташа Үлгерім"}
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900">{avgCompletion}%</h3>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
              {isRu ? "Процент доводимости" : "Орташа доводимость пайызы"}
            </p>
          </div>
        </div>

        {/* КАРТОЧКА 4: Белсенді марафондар */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-3 relative overflow-hidden group hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
              {isRu ? "Марафоны" : "Марафондар"}
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Flag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900">
              {activeMarathons.length} {isRu ? "активных" : "белсенді"}
            </h3>
            <p className="text-[11px] text-purple-600 font-bold mt-0.5">
              {isRu ? `Всего: ${marathons.length} марафонов` : `Жалпы: ${marathons.length} марафон`}
            </p>
          </div>
        </div>

      </div>

      {/* 3. 30 КҮНДІК БЕЛСЕНДІЛІК ГРАФИГІ */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-2">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
            {isRu ? "Активность учеников (последние 30 дней)" : "Оқушылар белсенділігі (соңғы 30 күн)"}
          </h3>
          <span className="text-xs font-bold text-gray-400">
            {isRu ? "Динамика ежедневных отчётов" : "Күндік отчёттар динамикасы"}
          </span>
        </div>
        <ActivityChart data={activity} isRu={isRu} />
      </div>

      {/* 4. НЕГІЗГІ ЖҰМЫС АЙМАҒЫ (2 КОЛОНКА) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* СОЛ ЖАҚ: ЕСЕПТЕРДІ ТЕКСЕРУ ЖӘНЕ МАРАФОНДАР ТАБЛИЦАСЫ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ЕСЕПТЕРДІ ТЕКСЕРУ БӨЛІМІ */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  {isRu ? "Отчёты учеников" : "Оқушылардың Есептері"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isRu ? "Проверяйте поступившие отчёты и начисляйте баллы" : "Келген отчёттарды тексеріп, балдарын бекітіңіз"}
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-2xl border border-gray-100">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "pending"
                      ? "bg-white text-purple-700 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {isRu ? "Ожидают" : "Күтілуде"} ({pendingSubmissions.length})
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "all"
                      ? "bg-white text-purple-700 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {isRu ? "Все" : "Барлығы"} ({submissionsList.length})
                </button>
              </div>
            </div>

            {/* ЕСЕПТЕР ТІЗІМІ */}
            <div className="space-y-4">
              {submissionsList.filter((s) => activeTab === "all" || s.status === "PENDING").length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                  <p className="text-xs font-bold text-gray-700">
                    {isRu ? "Отчётов для проверки не осталось!" : "Тексерілетін есептер қалмады!"}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {isRu ? "Все работы учеников проверены." : "Барлық оқушылардың жұмыстары тексерілді."}
                  </p>
                </div>
              ) : (
                submissionsList
                  .filter((s) => activeTab === "all" || s.status === "PENDING")
                  .map((sub) => {
                    const studentObj = students.find((st) => st.id === sub.studentId);
                    const studentName = studentObj?.name || (isRu ? "Ученик" : "Оқушы");
                    const checklist = sub.checklist || { routine: false, video: false, homework: false };

                    return (
                      <div
                        key={sub.id}
                        className="p-5 rounded-2xl border border-gray-100 bg-gray-50/40 hover:bg-white transition-all space-y-4 shadow-2xs hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 font-black flex items-center justify-center text-sm border border-purple-200">
                              {studentName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900">{studentName}</h3>
                              <p className="text-[11px] text-gray-400">
                                {isRu ? `День #${sub.dayNumber}` : `Күн #${sub.dayNumber}`}
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] font-bold text-gray-400 bg-white px-2.5 py-1 rounded-xl border border-gray-100">
                            {sub.submittedAt ? formatDate(new Date(sub.submittedAt)) : (isRu ? "Новый" : "Жаңа")}
                          </span>
                        </div>

                        {/* Чек-лист параметрлері */}
                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100/80 text-[11px]">
                          <div className={`p-2 rounded-xl text-center font-bold ${checklist.routine ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                            {isRu ? "Утренний подъём: " : "Таңғы тәртіп: "}{checklist.routine ? "✓" : "✗"}
                          </div>
                          <div className={`p-2 rounded-xl text-center font-bold ${checklist.video ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                            {isRu ? "Урок: " : "Сабақ: "}{checklist.video ? "✓" : "✗"}
                          </div>
                          <div className={`p-2 rounded-xl text-center font-bold ${checklist.homework ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                            {isRu ? "Задание: " : "Тапсырма: "}{checklist.homework ? "✓" : "✗"}
                          </div>
                        </div>

                        {/* Тексеру әрекеттері */}
                        <div className="flex items-center justify-between pt-1">
                          {sub.fileUrl ? (
                            <a
                              href={sub.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:underline"
                            >
                              <FileText className="w-4 h-4" /> {isRu ? "Открыть файл" : "Файлды ашу"}
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              {isRu ? "Файл не прикреплён" : "Файл тіркелмеген"}
                            </span>
                          )}

                          <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer">
                              <X className="w-3.5 h-3.5" /> {isRu ? "Отклонить" : "Қайтару"}
                            </button>
                            <button className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold transition-colors flex items-center gap-1 shadow-sm shadow-purple-200 cursor-pointer">
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> {isRu ? "Принять" : "Қабылдау"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* МАРАФОНДАР ТАБЛИЦАСЫ */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              {isRu ? "Марафоны организации" : "Ұйым Марафондары"}
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase text-gray-400 tracking-wide font-bold">
                    <th className="pb-3 px-2">{isRu ? "Название марафона" : "Марафон атауы"}</th>
                    <th className="pb-3 px-2">{isRu ? "Период" : "Мерзімі"}</th>
                    <th className="pb-3 px-2">{isRu ? "Участники" : "Қатысушылар"}</th>
                    <th className="pb-3 px-2">{isRu ? "Статус" : "Күйі"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/80 text-xs">
                  {marathons.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">
                        {isRu ? "Марафоны не найдены." : "Марафондар табылған жоқ."}
                      </td>
                    </tr>
                  )}
                  {marathons.map((m) => {
                    const start = new Date(m.startDate);
                    const end = new Date(m.startDate);
                    end.setDate(end.getDate() + (m.durationDays || 21) - 1);
                    const count = students.filter((s) => s.marathonId === m.id).length;
                    return (
                      <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-2 font-bold text-gray-800">{m.title}</td>
                        <td className="py-3 px-2 text-gray-500 font-medium">
                          {formatDate(start)} — {formatDate(end)}
                        </td>
                        <td className="py-3 px-2 font-black text-purple-700">
                          {count} {isRu ? "учеников" : "оқушы"}
                        </td>
                        <td className="py-3 px-2">
                          <Badge tone={m.status === MARATHON_STATUS.ACTIVE ? "steppe" : "neutral"}>
                            {MARATHON_STATUS_LABELS[m.status] || (isRu ? "Черновик" : "Черновик")}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ОҢ ЖАҚ: ТӘУЕКЕЛ АЙМАҒЫ ЖӘНЕ ЖЫЛДАМ ӘРЕКЕТТЕР */}
        <div className="space-y-6">

          {/* ТӘУЕКЕЛ АЙМАҒЫ (РИСК-ЗОНА) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800">
                  {isRu ? "Зона риска" : "Тәуекел Аймағы"}
                </h3>
              </div>
              <span className="text-[10px] bg-rose-50 text-rose-700 font-extrabold px-2 py-0.5 rounded-md">
                {atRiskStudents.length} {isRu ? "Студентов" : "Студент"}
              </span>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              {isRu ? "Ученики с успеваемостью ниже 50%:" : "Үлгерімі 50%-дан төмен оқушылар тізімі:"}
            </p>

            <div className="space-y-3">
              {atRiskStudents.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  {isRu ? "У всех учеников отличная успеваемость! 🎉" : "Барлық оқушылардың үлгерімі жақсы! 🎉"}
                </p>
              ) : (
                atRiskStudents.map((st) => {
                  const marathon = state?.marathons?.[st.marathonId] || {};
                  const rate = completionRate(st, marathon, state?.submissions || {});

                  return (
                    <div key={st.id} className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{st.name}</h4>
                        <p className="text-[10px] text-rose-600 font-extrabold">
                          {isRu ? "Успеваемость: " : "Үлгерім: "}{rate}%
                        </p>
                      </div>

                      <button className="p-2 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-colors shrink-0 cursor-pointer">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ЖЫЛДАМ ӘРЕКЕТТЕР */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
              {isRu ? "Быстрые действия" : "Жылдам Әрекеттер"}
            </h3>

            <div className="space-y-2">
              <button className="w-full p-3 rounded-2xl bg-gray-50 hover:bg-purple-50 hover:text-purple-700 border border-gray-100 text-xs font-bold text-gray-700 transition-all flex items-center justify-between cursor-pointer">
                <span>{isRu ? "Добавить новый урок" : "Жаңа сабақ қосу"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full p-3 rounded-2xl bg-gray-50 hover:bg-purple-50 hover:text-purple-700 border border-gray-100 text-xs font-bold text-gray-700 transition-all flex items-center justify-between cursor-pointer">
                <span>{isRu ? "Отправить общее объявление" : "Жалпы хабарландыру жіберу"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}