"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { 
  Plus, Users, BookOpen, ShieldCheck, 
  Calendar, Sparkles, Edit3, Trash2, Loader2, Save, X, AlertTriangle 
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { MARATHON_STATUS_LABELS, MARATHON_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import LoadingState from "@/components/LoadingState";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

export default function TenantAdminHome({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";
  const { orgId } = use(params);
  const { ready, tick } = useData();
  const [marathons, setMarathons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Модальдік терезе стейттері
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMarathon, setEditingMarathon] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Өшіру модалі үшін стейт
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    startDate: "",
    durationDays: 21,
    status: MARATHON_STATUS.ACTIVE,
  });

  const loadMarathons = async () => {
    try {
      setLoading(true);
      if (actions.getMarathonsByOrgId) {
        const res = await actions.getMarathonsByOrgId(orgId);
        setMarathons(res || []);
      } else if (actions.getMarathons) {
        const all = await actions.getMarathons();
        const filtered = (all || []).filter(
          (m) => String(m.orgId) === String(orgId) || String(m.organizerId) === String(orgId)
        );
        setMarathons(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch marathons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      loadMarathons();
    }
  }, [ready, orgId, tick]);

  // Өңдеу модалін ашу
  const handleOpenEdit = (marathon) => {
    setEditingMarathon(marathon);
    setEditForm({
      title: marathon.title || "",
      description: marathon.description || "",
      startDate: marathon.startDate ? new Date(marathon.startDate).toISOString().split("T")[0] : "",
      durationDays: marathon.durationDays || 21,
      status: marathon.status || MARATHON_STATUS.ACTIVE,
    });
    setShowEditModal(true);
  };

  // Сақтау
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingMarathon || saving) return;

    setSaving(true);
    try {
      const res = await actions.updateMarathonAction(editingMarathon.id, editForm);
      if (res?.ok) {
        setShowEditModal(false);
        await loadMarathons();
      } else {
        alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || (isRu ? "Не удалось отредактировать" : "Өңдеу мүмкін болмады")));
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Өшіруді орындау
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId || deleting) return;

    setDeleting(true);
    try {
      const res = await actions.deleteMarathonAction(deleteConfirmId);
      if (res?.ok) {
        setDeleteConfirmId(null);
        await loadMarathons();
      } else {
        alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || (isRu ? "Не удалось удалить" : "Өшіру мүмкін болмады")));
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  if (!ready || loading) return <LoadingState />;

  const totalStudents = marathons.reduce((acc, m) => acc + (m.studentsCount || m._count?.students || m.students?.length || 0), 0);
  const activeMarathons = marathons.filter((m) => m.status === MARATHON_STATUS.ACTIVE).length;

  return (
    <div className="w-full space-y-6 font-sans text-slate-900 pb-12">
      {/* 1. Жоғарғы Тақырып */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isRu ? "Управление марафонами" : "Марафондарды басқару"}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {isRu 
              ? "Центр активности всех марафонов, кураторов и учеников" 
              : "Барлық марафондар, Кураторлар және оқушылар белсенділігінің орталығы"}
          </p>
        </div>
        <Link href={`/${lang}/org/admin/marathons/new`}>
          <button className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-200 transition flex items-center gap-2 self-start sm:self-auto cursor-pointer">
            <Plus size={16} /> {isRu ? "Создать марафон" : "Марафон құру"}
          </button>
        </Link>
      </div>

      {/* 2. Метрикалар */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              {isRu ? "Активные марафоны" : "Белсенді Марафондар"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {activeMarathons} {isRu ? "марафонов" : "марафон"}
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
            <BookOpen size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              {isRu ? "Всего учеников" : "Жалпы Оқушылар"}
            </p>
            <p className="text-2xl font-black text-purple-700 mt-1">
              {totalStudents} {isRu ? "студентов" : "студент"}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              {isRu ? "Статус системы" : "Жүйе Мәртебесі"}
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">PRO {isRu ? "Тариф" : "Тариф"}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* 3. Бос Күй */}
      {marathons.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
            <BookOpen size={32} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              {isRu ? "Марафоны ещё не созданы" : "Әлі марафондар құрылмаған"}
            </h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              {isRu 
                ? "Создайте ваш первый марафон и начните приглашать кураторов и учеников." 
                : "Алғашқы марафоныңызды жасап, Кураторлар мен оқушыларды шақыруды бастаңыз."}
            </p>
          </div>
          <Link href={`/${lang}/org/admin/marathons/new`} className="inline-block pt-2">
            <button className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition cursor-pointer">
              + {isRu ? "Запустить первый марафон" : "Бірінші марафонды бастау"}
            </button>
          </Link>
        </div>
      )}

      {/* 4. Марафондар Тізімі */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {marathons.map((marathon) => {
          const studentsCount = marathon.studentsCount ?? marathon._count?.students ?? marathon.students?.length ?? 0;
          
          const filledDaysCount = marathon.filledDays ?? (
            marathon.tasks && Array.isArray(marathon.tasks) && marathon.tasks.length > 0
              ? new Set(marathon.tasks.map((t) => t.dayNumber)).size
              : (marathon.tasksCount ?? marathon._count?.tasks ?? marathon.tasks?.length ?? 0)
          );

          const isActive = marathon.status === MARATHON_STATUS.ACTIVE;

          const statusText = isRu 
            ? (marathon.status === "ACTIVE" ? "Активный" : marathon.status === "DRAFT" ? "Черновик" : "Завершён")
            : (MARATHON_STATUS_LABELS[marathon.status] || "Черновик");

          return (
            <div key={marathon.id} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-full space-y-4 relative">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <Link 
                    href={`/${lang}/org/admin/marathons/${marathon.id}`}
                    className="font-black text-slate-900 text-lg hover:text-purple-600 transition"
                  >
                    {marathon.title}
                  </Link>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[11px] font-extrabold px-3 py-1 rounded-xl border ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {statusText}
                    </span>

                    <button
                      onClick={() => handleOpenEdit(marathon)}
                      className="p-1.5 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded-xl transition cursor-pointer"
                      title={isRu ? "Редактировать" : "Өңдеу"}
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(marathon.id)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                      title={isRu ? "Удалить" : "Өшіру"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {marathon.description || (isRu ? "Нет описания марафона." : "Марафон сипаттамасы жоқ.")}
                </p>
              </div>

              {/* СТАТИСТИКА БӨЛІМІ */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Users size={15} className="text-purple-600" /> {studentsCount} {isRu ? "учеников" : "оқушы"}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={15} className="text-slate-400" />
                  <strong>{filledDaysCount}</strong> / {marathon.durationDays || 21} {isRu ? "дней готово" : "күн дайын"}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar size={13} />{isRu ? "Старт: " : "Басталуы: "}{formatDate(marathon.startDate)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Өңдеу Модалі */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {isRu ? "Редактирование марафона" : "Марафонды Өңдеу"}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {isRu ? "Название марафона *" : "Марафон Атауы *"}
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {isRu ? "Описание" : "Сипаттамасы"}
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {isRu ? "Длительность (Дней)" : "Ұзақтығы (Күн)"}
                  </label>
                  <input
                    type="number"
                    value={editForm.durationDays}
                    onChange={(e) => setEditForm({ ...editForm, durationDays: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {isRu ? "Статус" : "Мәртебесі"}
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="ACTIVE">{isRu ? "Активный (Active)" : "Белсенді (Active)"}</option>
                    <option value="DRAFT">{isRu ? "Черновик (Draft)" : "Черновик (Draft)"}</option>
                    <option value="COMPLETED">{isRu ? "Завершён" : "Аяқталған"}</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  {isRu ? "Отмена" : "Бас тарту"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? (isRu ? "Сохранение..." : "Сақталуда...") : (isRu ? "Сохранить" : "Сақтау")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Өшіру Модалі */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 animate-in zoom-in duration-200 border border-rose-100">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                {isRu ? "Удаление марафона" : "Марафонды Өшіру"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {isRu 
                  ? "Вы уверены, что хотите удалить этот марафон и все связанные с ним уроки? Это действие нельзя отменить."
                  : "Осы марафонды және оған тиесілі барлық сабақтарды өшіруге сенімдісіз бе? Бұл әрекетті қайтару мүмкін емес."}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                {isRu ? "Отмена" : "Бас тарту"}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-rose-200 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting 
                  ? (isRu ? "Удаление..." : "Өшірілуде...") 
                  : (isRu ? "Да, удалить" : "Иә, Өшіру")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}