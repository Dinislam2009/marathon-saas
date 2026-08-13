"use client";

import React, { useState, useEffect, useCallback, useRef, use } from "react";
import { Users, Search, Loader2, UserPlus } from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import LoadingState from "@/components/LoadingState";

// --- 1. МАРАФОНҒА ҚАТЫСУШЫ (УЧЕНИК) ҚОСУ СМАРТ МОДАЛІ ---
function AddStudentModal({ isOpen, onClose, marathons, onAddStudent, isRu }) {
  const [selectedMarathon, setSelectedMarathon] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle, checking, ready, invalid_role, already_in_this_marathon, not_found
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
      if (typeof actions.checkStudentForMarathonAction === "function") {
        const result = await actions.checkStudentForMarathonAction(value, isEmail, marathonId);
        const user = result?.user;

        if (!result || result.status === "not_found" || !user) {
          setStatus("not_found");
          setFoundUser(null);
          return;
        }

        if (user.role === "OWNER" || user.role === "ORGANIZER" || user.role === "CURATOR") {
          setStatus("invalid_role");
          setStatusMessage(
            isRu
              ? `Пользователь со статусом "${user.role}" не может быть добавлен как обычный ученик.`
              : `"${user.role}" рөліндегі пайдаланушыны қарапайым оқушы ретінде қосуға болмайды.`
          );
          setFoundUser(user);
          return;
        }

        if (result.status === "already_in_this_marathon") {
          setStatus("already_in_this_marathon");
          setStatusMessage(
            isRu
              ? "Этот ученик уже состоит в данном марафоне."
              : "Бұл оқушы бұл марафонда бұрыннан бар."
          );
          setFoundUser(user);
          return;
        }

        setStatus("ready");
        setFoundUser(user);
      } else {
        setStatus("ready");
      }
    } catch {
      setStatus("not_found");
      setFoundUser(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMarathon || status !== "ready") return;

    try {
      setIsSubmitting(true);
      if (onAddStudent) {
        await onAddStudent({
          marathonId: selectedMarathon,
          userId: foundUser?.id,
          name: foundUser?.name || "",
          email: foundUser?.email || "",
          phone: foundUser?.phone || "",
        });
      }

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
        {/* HEADER */}
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
          {/* МАРАФОН ТАҢДАУ */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              {isRu ? "ВЫБЕРИТЕ МАРАФОН" : "МАРАФОНДЫ ТАҢДАҢЫЗ"}
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

          {/* CONTACT INPUT */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              {isRu ? "EMAIL ИЛИ НОМЕР ТЕЛЕФОНА" : "EMAIL НЕМЕСЕ ТЕЛЕФОН НӨМІРІ"}
            </label>

            <input
              type="text"
              placeholder={isRu ? "email@mail.ru или +7 (7XX)..." : "email@mail.kz немесе +7 (7XX)..."}
              value={contactInput}
              onChange={handleInputChange}
              required
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all text-xs font-medium bg-gray-50"
            />

            {/* 🔍 CHECKING */}
            {status === "checking" && (
              <div className="mt-3 p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-600 font-medium animate-pulse">
                🔍 {isRu ? "Проверка данных в базе..." : "Базадан деректер тексерілуде..."}
              </div>
            )}

            {/* ✅ READY */}
            {status === "ready" && foundUser && (
              <div className="mt-3 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
                    ✓ {isRu ? "ГОТОВО К ДОБАВЛЕНИЮ!" : "ҚОСУҒА ДАЙЫН!"}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-extrabold uppercase">
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

            {/* ⛔ INVALID ROLE */}
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

            {/* ⚠️ ALREADY IN THIS MARATHON */}
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

            {/* ✕ NOT FOUND */}
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

// --- 2. НЕГІЗГІ ОҚУШЫЛАР БЕТІ ---
export default function AdminStudentsPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const orgId = resolvedParams?.orgId;

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [marathons, setMarathons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigningId, setAssigningId] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      let activeMarathons = [];
      if (typeof actions.getMarathonsByOrgId === "function") {
        activeMarathons = await actions.getMarathonsByOrgId(orgId);
        setMarathons(activeMarathons || []);
      }
      const validMarathonIds = new Set((activeMarathons || []).map((m) => m.id));

      if (typeof actions.getStudentsByOrgId === "function") {
        const studentsList = await actions.getStudentsByOrgId(orgId);
        setStudents(studentsList || []);
      }

      const res = await fetch(`/api/org/groups?orgId=${orgId}`);
      const json = await res.json();

      if (json.ok) {
        const activeGroups = (json.groups || []).filter((g) =>
          g.marathonId ? validMarathonIds.has(g.marathonId) : true
        );
        setGroups(activeGroups);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddStudentToMarathon = async (data) => {
    try {
      if (typeof actions.addStudentToMarathonAction === "function") {
        const res = await actions.addStudentToMarathonAction(data);
        if (res?.ok) {
          await fetchData();
        } else {
          alert((isRu ? "Ошибка: " : "Қате: ") + res?.error);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignGroup = async (studentId, groupId) => {
    try {
      setAssigningId(studentId);
      if (typeof actions.assignStudentToGroupAction === "function") {
        const res = await actions.assignStudentToGroupAction(studentId, groupId);
        if (res?.ok) {
          setStudents((prev) =>
            prev.map((s) => (s.id === studentId ? { ...s, groupId: groupId || null } : s))
          );
          await fetchData();
        } else {
          alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || ""));
        }
      }
    } catch (err) {
      console.error("Assign group error:", err);
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const cleanQuery = searchQuery.trim().toLowerCase().replace(/\D/g, "");
  const textQuery = searchQuery.trim().toLowerCase();

  const filteredStudents = students.filter((s) => {
    if (!textQuery) return true;

    const nameMatch = s.name?.toLowerCase().includes(textQuery);
    const emailMatch = s.email?.toLowerCase().includes(textQuery);
    const rawPhoneDigits = s.phone ? String(s.phone).replace(/\D/g, "") : "";
    const phoneMatch = s.phone?.toLowerCase().includes(textQuery) || (cleanQuery && rawPhoneDigits.includes(cleanQuery));

    return nameMatch || emailMatch || phoneMatch;
  });

  return (
    <div className="space-y-6 w-full pb-12 font-sans text-slate-900">
      {/* 1. БӨЛІМ ШАПКАСЫ ЖӘНЕ ІЗДЕУ / БАТЫРМА */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isRu ? "Все участники" : "Барлық Қатысушылар"}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {isRu
              ? "Участники и группы всех марафонов организации в одном месте."
              : "Ұйымның барлық марафондарының қатысушылары мен топтары бір жерде."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={isRu ? "Имя, Email или Номер..." : "Аты, Email немесе Телефон..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-200 transition cursor-pointer shrink-0"
          >
            <UserPlus size={16} />
            {isRu ? "Добавить в марафон" : "Марафонға қосу"}
          </button>
        </div>
      </div>

      {/* 2. ИНФО КАРТОЧКА */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              {isRu ? "Всего участников" : "Барлық Қатысушы"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{students.length}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
            <Users size={22} />
          </div>
        </div>
      </div>

      {/* 3. ОҚУШЫЛАР КЕСТЕСІ */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">{isRu ? "ФИО" : "Аты-жөні"}</th>
                <th className="px-6 py-4">{isRu ? "Email / Телефон" : "Email / Телефон"}</th>
                <th className="px-6 py-4">{isRu ? "Марафон" : "Марафон"}</th>
                <th className="px-6 py-4">{isRu ? "Привязать к группе" : "Топқа бекіту"}</th>
                <th className="px-6 py-4 text-right">{isRu ? "Баллы" : "Баллдар"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    {isRu
                      ? "По результатам поиска участники не найдены."
                      : "Іздеу нәтижесі бойынша қатысушылар табылмады."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const availableGroups = groups.filter(
                    (g) => !student.marathonId || g.marathonId === student.marathonId
                  );

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">{student.name}</td>
                      <td className="px-6 py-4 space-y-0.5">
                        <div className="font-semibold text-slate-800">{student.email}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{student.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-xl font-extrabold text-[11px]">
                          {student.marathonTitle || (isRu ? "Без марафона" : "Марафонсыз")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={student.groupId || ""}
                            disabled={assigningId === student.id}
                            onChange={(e) => handleAssignGroup(student.id, e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 cursor-pointer disabled:opacity-50"
                          >
                            <option value="">{isRu ? "— Без группы —" : "— Топсыз —"}</option>
                            {availableGroups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                          {assigningId === student.id && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-purple-700 text-sm">
                        {student.points || 0} {isRu ? "б" : "б"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* МОДАЛЬ ТЕРЕЗЕ */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        marathons={marathons}
        onAddStudent={handleAddStudentToMarathon}
        isRu={isRu}
      />
    </div>
  );
}