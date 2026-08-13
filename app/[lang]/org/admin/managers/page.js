"use client";

import React, { useState, useEffect, useCallback, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import { Users, UserPlus, Search, Award, TrendingUp, X, AlertCircle } from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import LoadingState from "@/components/LoadingState";

// МЕНЕДЖЕР ҚОСУ СМАРТ МОДАЛІ
function AddManagerModal({ isOpen, onClose, onRefresh, isRu, orgId }) {
  const [contactInput, setContactInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
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

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSubmitError("");

    if (!val.trim()) {
      setContactInput("");
      clearTimeout(debounceRef.current);
      setStatus("idle");
      setFoundUser(null);
      return;
    }

    const isEmail = val.includes("@") || /[a-zA-Z]/.test(val);
    let formattedVal = isEmail ? val : formatPhoneNumber(val);
    setContactInput(formattedVal);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setStatus("checking");
      try {
        if (typeof actions.checkUserForManagerAction === "function") {
          const res = await actions.checkUserForManagerAction(formattedVal.trim(), isEmail);
          if (res?.status === "ready") {
            setStatus("ready");
            setFoundUser(res.user);
          } else if (res?.status === "invalid_role" || res?.status === "already_manager") {
            setStatus(res.status);
            setStatusMessage(res.message || "");
            setFoundUser(res.user || null);
          } else {
            setStatus("not_found");
            setFoundUser(null);
          }
        } else {
          setStatus("ready");
        }
      } catch (err) {
        console.error("Check user for manager error:", err);
        setStatus("not_found");
        setFoundUser(null);
      }
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status !== "ready" || !foundUser) return;
    setSubmitError("");

    try {
      setIsSubmitting(true);
      if (typeof actions.assignManagerRoleAction === "function") {
        const res = await actions.assignManagerRoleAction(foundUser.id, orgId);
        
        if (res?.ok) {
          onRefresh();
          onClose();
        } else {
          setSubmitError(res?.error || (isRu ? "Ошибка при назначении" : "Тағайындау кезінде қате орын алды"));
        }
      }
    } catch (err) {
      console.error("Assign manager error:", err);
      setSubmitError(err.message || "Серверлік қате орын алды");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 font-sans animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl transition-all border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-slate-900">
            {isRu ? "Назначить Менеджера" : "Менеджер Тағайындау"}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {isRu ? "EMAIL ИЛИ НОМЕР ТЕЛЕФОНА" : "EMAIL НЕМЕСЕ ТЕЛЕФОН НӨМІРІ"}
            </label>
            <input
              type="text"
              placeholder={isRu ? "email@mail.ru или +7 (7XX)..." : "email@mail.kz немесе +7 (7XX)..."}
              value={contactInput}
              onChange={handleInputChange}
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition bg-slate-50 text-xs font-semibold"
            />

            {status === "checking" && (
              <p className="mt-3 text-xs text-purple-600 animate-pulse font-bold flex items-center gap-1.5">
                🔍 {isRu ? "Проверка данных..." : "Тексерілуде..."}
              </p>
            )}

            {status === "ready" && foundUser && (
              <div className="mt-3 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1 text-xs">
                <span className="font-extrabold text-emerald-700 uppercase tracking-wider block mb-1">
                  ✓ {isRu ? "ГОТОВО К НАЗНАЧЕНИЮ!" : "ТАҒАЙЫНДАУҒА ДАЙЫН!"}
                </span>
                <p><span className="font-bold text-slate-600">{isRu ? "ФИО: " : "Аты-жөні: "}</span>{foundUser.name}</p>
                <p><span className="font-bold text-slate-600">Email: </span>{foundUser.email || "—"}</p>
                <p><span className="font-bold text-slate-600">{isRu ? "Телефон: " : "Телефоны: "}</span>{foundUser.phone || "—"}</p>
              </div>
            )}

            {(status === "invalid_role" || status === "already_manager") && (
              <div className="mt-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 font-bold">
                ⚠️ {statusMessage}
              </div>
            )}

            {status === "not_found" && (
              <div className="mt-3 p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-700 font-bold">
                ✕ {isRu ? "Пользователь не найден в базе." : "Пайдаланушы базада табылмады."}
              </div>
            )}

            {submitError && (
              <div className="mt-3 p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || status !== "ready"}
            className="w-full rounded-2xl bg-purple-600 py-3.5 text-xs font-extrabold text-white shadow-md shadow-purple-200 hover:bg-purple-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            {isSubmitting 
              ? (isRu ? "Сохранение..." : "Сақталуда...") 
              : (isRu ? "Назначить Менеджера" : "Менеджер рөлін беру")}
          </button>
        </form>
      </div>
    </div>
  );
}

// БАСТЫ МЕНЕДЖЕРЛЕР БЕТІ
export default function AdminManagersPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const paramOrgId = resolvedParams?.orgId;

  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId") || paramOrgId;

  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (typeof actions.getManagersByOrgId === "function") {
        const list = await actions.getManagersByOrgId(orgId);
        setManagers(list || []);
      }
    } catch (err) {
      console.error("Fetch managers error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;

  const filtered = managers.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone?.includes(searchQuery)
  );

  const totalStudentsAdded = managers.reduce((acc, m) => acc + (m.studentsAdded || 0), 0);

  return (
    <div className="space-y-6 w-full pb-12 font-sans text-slate-900">
      {/* HEADER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-extrabold rounded-full border border-purple-100 uppercase">
            {isRu ? "Отдел продаж" : "Сату Бөлімі"}
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
            {isRu ? "Менеджеры и Статистика" : "Менеджерлер және Статистика"}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {isRu
              ? "Управляйте менеджерами и отслеживайте количество привлеченных учеников."
              : "Менеджерлерді басқарыңыз және тартылған оқушылар статистикасын бақылаңыз."}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-200 transition cursor-pointer"
        >
          <UserPlus size={16} />
          {isRu ? "Назначить Менеджера" : "Менеджер Қосу"}
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase">{isRu ? "Всего Менеджеров" : "Барлық Менеджер"}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{managers.length}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase">{isRu ? "Привлечено Учеников" : "Тіркелген Оқушылар"}</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{totalStudentsAdded}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase">{isRu ? "Средняя конверсия" : "Орташа Көрсеткіш"}</p>
            <p className="text-2xl font-black text-purple-700 mt-1">
              {managers.length > 0 ? Math.round(totalStudentsAdded / managers.length) : 0} {isRu ? "учен/мен" : "оқ/мен"}
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={isRu ? "Поиск менеджера..." : "Менеджерді іздеу..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <table className="w-full text-left text-xs font-medium text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
            <tr>
              <th className="px-6 py-4">{isRu ? "ФИО Менеджера" : "Менеджер Аты-жөні"}</th>
              <th className="px-6 py-4">{isRu ? "Контакты" : "Байланыс"}</th>
              <th className="px-6 py-4">{isRu ? "Привлечено Учеников" : "Тіркеген Оқушылары"}</th>
              <th className="px-6 py-4 text-right">{isRu ? "Статус" : "Күйі"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-semibold">
                  {isRu ? "Менеджеры не найдены." : "Менеджерлер табылмады."}
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">{m.name}</td>
                  <td className="px-6 py-4 space-y-0.5">
                    <div className="font-semibold text-slate-800">{m.email || "—"}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{m.phone || "—"}</div>
                  </td>
                  <td className="px-6 py-4 font-black text-emerald-600 text-sm">
                    {m.studentsAdded || 0} {isRu ? "учеников" : "оқушы"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-extrabold text-[10px] uppercase">
                      Active Manager
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchData}
        isRu={isRu}
        orgId={orgId}
      />
    </div>
  );
}