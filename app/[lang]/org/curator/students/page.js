"use client";

import { use, useState, useMemo, useEffect, useRef } from "react";
import { 
  Search, 
  Users, 
  Trophy, 
  GraduationCap, 
  Plus, 
  Sparkles
} from "lucide-react";
import { useData } from "@/context/DataContext";
import LoadingState from "@/components/LoadingState";
import Badge from "@/components/Badge";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

function KpiCard({ icon: Icon, label, value, colorClass }) {
  return (
    <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center gap-4 font-sans">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${colorClass}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// 1. ОҚУШЫЛАРДЫ БАЗАДАН ТАУЫП ҚОСАТЫН СМАРТ МОДАЛЬ
function AddStudentModal({ isOpen, onClose, marathons, onAdd, onCheckStudent }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [selectedMarathon, setSelectedMarathon] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  if (!isOpen) return null;

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";

    let result = "+7 (";
    const cleanBody = digits.startsWith("7") ? digits.slice(1) : digits;

    if (cleanBody.length > 0) result += cleanBody.substring(0, 3);
    if (cleanBody.length >= 3) result += `) ${cleanBody.substring(3, 6)}`;
    if (cleanBody.length >= 6) result += `-${cleanBody.substring(6, 8)}`;
    if (cleanBody.length >= 8) result += `-${cleanBody.substring(8, 10)}`;

    return result;
  };

  const scheduleVerify = (value, isEmail, marathonId) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      verifyStudent(value, isEmail, marathonId);
    }, 300);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;

    if (!val.trim()) {
      setContactInput("");
      clearTimeout(debounceRef.current);
      setStatus("idle");
      setStatusMessage("");
      setFoundUser(null);
      return;
    }

    const isEmail = val.includes("@") || /[a-zA-Z]/.test(val);
    let formattedVal = isEmail ? val : formatPhoneNumber(val);

    setContactInput(formattedVal);

    if (!selectedMarathon) return;

    const rawDigits = formattedVal.replace(/\D/g, "");

    if ((isEmail && formattedVal.trim().length > 4) || rawDigits.length === 11) {
      scheduleVerify(formattedVal.trim(), isEmail, selectedMarathon);
    } else {
      clearTimeout(debounceRef.current);
      setStatus("idle");
      setStatusMessage("");
      setFoundUser(null);
    }
  };

  const verifyStudent = async (value, isEmail, marathonId) => {
    setStatus("checking");
    try {
      if (onCheckStudent) {
        const result = await onCheckStudent(value, isEmail, marathonId);
        setStatus(result?.status || "not_found");
        setStatusMessage(result?.message || "");
        setFoundUser(result?.user || null);
      }
    } catch {
      setStatus("not_found");
      setStatusMessage(isRu ? "Ошибка при проверке." : "Тексеру кезінде қате шықты.");
      setFoundUser(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMarathon || status !== "ready") return;

    const trimmed = contactInput.trim();
    const isEmail = trimmed.includes("@");

    try {
      setIsSubmitting(true);
      await onAdd(selectedMarathon, {
        userId: foundUser?.id,
        name: foundUser?.name || (isRu ? "Ученик" : "Оқушы"),
        email: isEmail ? trimmed.toLowerCase() : foundUser?.email || null,
        phone: !isEmail ? trimmed : foundUser?.phone || "",
      });

      setContactInput("");
      setSelectedMarathon("");
      setStatus("idle");
      setStatusMessage("");
      setFoundUser(null);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-gray-900">
            {isRu ? "Добавить участника в марафон" : "Қатысушыны марафонға қосу"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              {isRu ? "Выберите марафон" : "Марафонды таңдаңыз"}
            </label>
            <select
              value={selectedMarathon}
              onChange={(e) => {
                const mId = e.target.value;
                setSelectedMarathon(mId);
                setStatus("idle");
                setStatusMessage("");
                setFoundUser(null);

                if (mId && contactInput.trim()) {
                  const isEmail = contactInput.includes("@");
                  scheduleVerify(contactInput.trim(), isEmail, mId);
                }
              }}
              required
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all bg-gray-50 text-xs font-medium cursor-pointer"
            >
              <option value="">{isRu ? "-- Выберите марафон --" : "-- Марафонды таңдау --"}</option>
              {marathons?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              {isRu ? "Email или Номер телефона" : "Email немесе Телефон нөмірі"}
            </label>

            <input
              type="text"
              placeholder={isRu ? "email@mail.ru или +7 (7XX)..." : "email@mail.kz немесе +7 (7XX)..."}
              value={contactInput}
              onChange={handleInputChange}
              required
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all text-xs font-medium bg-gray-50"
            />

            {status === "checking" && (
              <div className="mt-3 p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-600 font-medium animate-pulse">
                🔍 {isRu ? "Проверка данных в базе..." : "Базадан деректер тексерілуде..."}
              </div>
            )}

            {status === "ready" && foundUser && (
              <div className="mt-3 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
                    ✓ {isRu ? "Готово к добавлению!" : "Қосуға дайын!"}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                    {isRu ? "Ученик" : "Оқушы"}
                  </span>
                </div>
                <div className="text-xs space-y-1 text-emerald-950 font-medium">
                  <p><span className="text-emerald-700 font-bold">{isRu ? "ФИО: " : "Аты-жөні: "}</span> {foundUser.name}</p>
                  <p><span className="text-emerald-700 font-bold">{isRu ? "Почта: " : "Поштасы: "}</span> {foundUser.email || "—"}</p>
                  <p><span className="text-emerald-700 font-bold">{isRu ? "Телефон: " : "Телефоны: "}</span> {foundUser.phone || "—"}</p>
                </div>
              </div>
            )}

            {status === "invalid_role" && (
              <div className="mt-3 p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-700 space-y-1">
                <p className="font-bold">⛔ {statusMessage}</p>
                {foundUser && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    {isRu ? "Пользователь: " : "Пайдаланушы: "}<span className="font-semibold">{foundUser.name}</span>
                  </p>
                )}
              </div>
            )}

            {(status === "already_in_another_marathon" || status === "already_in_this_marathon") && (
              <div className="mt-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <p className="font-bold">⚠️ {statusMessage}</p>
                {foundUser && (
                  <p className="text-[11px] text-amber-700 font-medium">
                    {isRu ? "Ученик: " : "Оқушы: "}<span className="font-semibold">{foundUser.name}</span>
                  </p>
                )}
              </div>
            )}

            {status === "not_found" && (
              <div className="mt-3 p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-700 font-medium">
                ✕ {isRu ? "Пользователь не найден на платформе (Не зарегистрирован)." : "Платформада бұл пайдаланушы табылмады (Тіркелмеген)."}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || status !== "ready"}
            className="w-full rounded-2xl bg-purple-600 py-3.5 font-extrabold text-xs text-white shadow-md shadow-purple-200 transition-all hover:bg-purple-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-3 cursor-pointer"
          >
            {isSubmitting
              ? (isRu ? "Добавление..." : "Қосылуда...")
              : (isRu ? "Добавить в марафон" : "Марафонға қосу")}
          </button>
        </form>
      </div>
    </div>
  );
}

// 2. БЕТТІҢ НЕГІЗГІ КОМПОНЕНТІ
export default function CuratorStudentsPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const orgId = resolvedParams?.orgId;

  const { ready, state, refreshData, triggerUpdate } = useData();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dbStudents, setDbStudents] = useState([]);
  const [dbMarathons, setDbMarathons] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // ⚡ Базадан марафондар мен оқушыларды ТІКЕЛЕЙ жүктеу
  const fetchLocalData = async () => {
    if (!orgId) return;
    try {
      setLoadingDb(true);
      if (typeof actions.getMarathonsByOrgId === "function") {
        const mRes = await actions.getMarathonsByOrgId(orgId);
        setDbMarathons(mRes || []);
      }

      if (typeof actions.getStudentsByOrgId === "function") {
        const sRes = await actions.getStudentsByOrgId(orgId);
        setDbStudents(sRes || []);
      }
    } catch (err) {
      console.error("fetchLocalData error:", err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchLocalData();
  }, [orgId]);

  // Марафондар
  const marathons = useMemo(() => {
    if (dbMarathons.length > 0) return dbMarathons;
    if (!ready || !state?.marathons) return [];
    return Object.values(state.marathons);
  }, [dbMarathons, ready, state?.marathons]);

  // Оқушылар тізімін құрастыру
  const curatorStudents = useMemo(() => {
    const list = dbStudents.length > 0 ? dbStudents : (state?.students ? Object.values(state.students) : []);

    return list.map((s) => {
      const m = state?.marathons?.[s.marathonId] || dbMarathons.find(m => String(m.id) === String(s.marathonId));
      return {
        ...s,
        marathonTitle: m ? m.title : s.marathon?.title || (isRu ? "Марафон" : "Марафон"),
      };
    });
  }, [dbStudents, state?.students, dbMarathons, state?.marathons, isRu]);

  // Сүзгі
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return curatorStudents;
    return curatorStudents.filter((s) => {
      return (
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        (s.phone && String(s.phone).includes(q)) ||
        s.marathonTitle?.toLowerCase().includes(q)
      );
    });
  }, [curatorStudents, search]);

  const totalStudents = curatorStudents.length;
  const totalPoints = curatorStudents.reduce((sum, s) => sum + (s.points || s.progress || 0), 0);
  const avgPoints = totalStudents ? Math.round(totalPoints / totalStudents) : 0;

  // ⚡ Оқушыны марафонға қосу
  const handleAddStudent = async (marathonId, studentData) => {
    const fn = actions.addStudentToMarathon || actions.addStudentToMarathonAction;
    if (typeof fn === "function") {
      await fn({
        orgId,
        marathonId,
        ...studentData,
      });
    }
    
    await fetchLocalData();
    if (typeof refreshData === "function") refreshData();
    if (typeof triggerUpdate === "function") triggerUpdate();
  };

  // ⚡ Тексеру
  const handleCheckStudent = async (value, isEmail, marathonId) => {
    const fn = actions.checkStudent || actions.checkStudentForMarathonAction;
    if (typeof fn === "function") {
      return await fn(value, isEmail, marathonId);
    }
    return { status: "ready" };
  };

  if (!ready || loadingDb) return <LoadingState />;

  return (
    <div className="w-full pb-10 space-y-6 font-sans text-slate-900">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100">
            <Sparkles className="w-3.5 h-3.5" /> {isRu ? "Центр управления" : "Басқару Орталығы"}
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
            {isRu ? "Мои участники" : "Менің қатысушыларым"}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {isRu
              ? "Список участников закреплённых за вами марафонов и их результаты."
              : "Сізге бекітілген марафон қатысушыларының тізімі мен нәтижелері."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRu ? "Поиск участника..." : "Қатысушыны іздеу..."}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-purple-600 bg-gray-50/50 text-gray-900 transition-colors"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all w-full sm:w-auto shrink-0 shadow-sm shadow-purple-200 active:scale-95 cursor-pointer"
          >
            <Plus size={16} className="stroke-[3]" />
            {isRu ? "Открыть доступ (Добавить)" : "Доступ ашу (Қосу)"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard 
          icon={Users} 
          label={isRu ? "Мои участники" : "Қатысушыларым"} 
          value={isRu ? `${totalStudents} учеников` : `${totalStudents} оқушы`} 
          colorClass="bg-purple-50 text-purple-600 border-purple-100" 
        />
        <KpiCard 
          icon={Trophy} 
          label={isRu ? "Общие баллы" : "Жалпы ұпайлары"} 
          value={`${totalPoints} XP`} 
          colorClass="bg-amber-50 text-amber-600 border-amber-100" 
        />
        <KpiCard 
          icon={GraduationCap} 
          label={isRu ? "Средний балл" : "Орташа балл"} 
          value={`${avgPoints} XP`} 
          colorClass="bg-emerald-50 text-emerald-600 border-emerald-100" 
        />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-400 tracking-wider font-bold bg-gray-50/50">
                <th className="py-4 px-6">{isRu ? "ФИО / Контакты" : "Аты-жөні / Байланыс"}</th>
                <th className="py-4 px-6">{isRu ? "Марафон" : "Марафон"}</th>
                <th className="py-4 px-6">{isRu ? "Статус" : "Күйі"}</th>
                <th className="py-4 px-6 text-right">{isRu ? "Баллы" : "Ұпайы"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">
                    {isRu ? "Участники не найдены." : "Қатысушылар табылмады."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs border border-purple-200 shrink-0">
                          {student.name ? student.name.charAt(0) : (isRu ? "У" : "С")}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{student.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {student.phone || student.email || (isRu ? "Нет контактов" : "Байланыс жоқ")}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-block bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-xl font-bold">
                        {student.marathonTitle}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <Badge tone={student.status === "BLOCKED" ? "neutral" : "steppe"}>
                        {student.status === "BLOCKED" 
                          ? (isRu ? "Заблокирован" : "Бұғатталған") 
                          : (isRu ? "Активен" : "Белсенді")}
                      </Badge>
                    </td>

                    <td className="py-4 px-6 text-right font-black text-purple-700 text-sm">
                      {student.points || student.progress || 0} XP
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        marathons={marathons}
        onAdd={handleAddStudent}
        onCheckStudent={handleCheckStudent}
      />
    </div>
  );
}