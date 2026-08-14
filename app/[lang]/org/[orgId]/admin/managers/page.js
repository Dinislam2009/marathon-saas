"use client";

import React, { useState, useEffect, useCallback, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Users, UserPlus, Search, Award, TrendingUp, X, AlertCircle, Edit3, Trash2, Loader2, ShieldAlert 
} from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import LoadingState from "@/components/LoadingState";

// 1. МЕНЕДЖЕР ҚОСУ СМАРТ МОДАЛІ
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
        if (typeof actions.checkUserForManager === "function") {
          const res = await actions.checkUserForManager(formattedVal.trim(), isEmail);
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
      if (typeof actions.assignManagerRole === "function") {
        const res = await actions.assignManagerRole(foundUser.id, orgId);
        
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

// 2. МЕНЕДЖЕРДІ ӨҢДЕУ (EDIT) МОДАЛІ
function EditManagerModal({ isOpen, onClose, manager, onRefresh, isRu }) {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (manager) {
      setFormData({
        name: manager.name || "",
        email: manager.email === "—" ? "" : manager.email || "",
        phone: manager.phone === "—" ? "" : manager.phone || "",
      });
    }
  }, [manager]);

  if (!isOpen || !manager) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (typeof actions.updateManager === "function") {
        const res = await actions.updateManager(manager.id, formData);
        if (res?.ok) {
          await onRefresh();
          onClose();
        } else {
          alert((isRu ? "Ошибка: " : "Қате: ") + res?.error);
        }
      }
    } catch (err) {
      console.error("Update manager error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900">
            {isRu ? "Редактирование менеджера" : "Менеджерді Өңдеу"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">{isRu ? "ФИО" : "Аты-жөні"}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-purple-600"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-purple-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">{isRu ? "Телефон" : "Телефон"}</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-purple-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              {isRu ? "Отмена" : "Бас тарту"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? (isRu ? "Сохранение..." : "Сақталуда...") : (isRu ? "Сохранить" : "Сақтау")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. МЕНЕДЖЕРДІ ӨШІРУ (DELETE) МОДАЛІ
function DeleteManagerModal({ isOpen, onClose, manager, onRefresh, isRu }) {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !manager) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (typeof actions.removeManagerRole === "function") {
        const res = await actions.removeManagerRole(manager.id);
        if (res?.ok) {
          await onRefresh();
          onClose();
        } else {
          alert((isRu ? "Ошибка: " : "Қате: ") + res?.error);
        }
      }
    } catch (err) {
      console.error("Remove manager role error:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 font-sans">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center space-y-4 border border-rose-100">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert size={24} />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900">
            {isRu ? "Удалить менеджера?" : "Менеджер рөлін өшіру?"}
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {isRu ? "Снять роль менеджера с " : "Менеджер рөлін алып тастау: "}{" "}
            <span className="font-bold text-slate-800">{manager.name}</span>?
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            {isRu ? "Отмена" : "Бас тарту"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? (isRu ? "Удаление..." : "Өшірілуде...") : (isRu ? "Да, снять" : "Иә, Өшіру")}
          </button>
        </div>
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
  
  // Модальдер стейті
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [deletingManager, setDeletingManager] = useState(null);

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
              <th className="px-6 py-4 text-right">{isRu ? "Действия" : "Әрекеттер"}</th>
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
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingManager(m)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition cursor-pointer"
                        title={isRu ? "Редактировать" : "Өңдеу"}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => setDeletingManager(m)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title={isRu ? "Удалить" : "Өшіру"}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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

      <EditManagerModal
        isOpen={Boolean(editingManager)}
        onClose={() => setEditingManager(null)}
        manager={editingManager}
        onRefresh={fetchData}
        isRu={isRu}
      />

      <DeleteManagerModal
        isOpen={Boolean(deletingManager)}
        onClose={() => setDeletingManager(null)}
        manager={deletingManager}
        onRefresh={fetchData}
        isRu={isRu}
      />
    </div>
  );
}