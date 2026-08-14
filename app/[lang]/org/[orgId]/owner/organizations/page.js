"use client";

import React, { useEffect, useState } from "react";
import { 
  Search, 
  UserCheck, 
  ExternalLink, 
  Plus, 
  Loader2, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Save
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { 
  getAllOrganizers, 
  impersonateOrganization, 
  checkUserForOrganizer, 
  createOrganizerUser,
  updateOrganizer,
  deleteOrganizer
} from "@/app/actions";
import LoadingState from "@/components/LoadingState";
import AddOrganizerModal from "@/components/AddOrganizerModal";
import { useLanguage } from "@/context/LanguageContext";

export default function OwnerOrganizersPage() {
  const router = useRouter();
  const params = useParams();
  const langParam = params?.lang || "kz";

  const { lang } = useLanguage();
  const isRu = lang === "ru";
  
  const [loading, setLoading] = useState(true);
  const [organizers, setOrganizers] = useState([]);
  const [search, setSearch] = useState("");
  const [actionId, setId] = useState(null);

  // Модальдар мен Тоаст
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null); // Өңделіп жатқан ұйым
  const [deletingOrg, setDeletingOrg] = useState(null); // Өшірілетін ұйым
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  const loadData = async () => {
    try {
      const res = await getAllOrganizers();
      if (res?.ok) {
        setOrganizers(res.organizers || []);
      }
    } catch (err) {
      console.error("Data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImpersonate = async (orgId) => {
    setId(orgId);
    try {
      const res = await impersonateOrganization(orgId);
      if (res?.ok) {
        router.push(`/${langParam}/org/${orgId}/admin`);
      } else {
        showToast((isRu ? "Ошибка: " : "Қате: ") + (res?.error || (isRu ? "Ошибка доступа" : "Қолжетімділік қатесі")), "error");
        setId(null);
      }
    } catch (err) {
      console.error("Impersonate error:", err);
      showToast(isRu ? "Ошибка сервера" : "Серверде қате орын алды", "error");
      setId(null);
    }
  };

  const handleCheckUser = async (contactValue, isEmail) => {
    return await checkUserForOrganizer(contactValue, isEmail);
  };

  const handleAddOrganizer = async (data) => {
    try {
      const res = await createOrganizerUser(data);

      if (res?.ok) {
        showToast(isRu ? "Организатор успешно прикреплен!" : "Организатор сәтті бекітілді!", "success");
        setIsModalOpen(false); // 👈 Модалканы жабамыз
        await loadData();      // 👈 Тізімді қайта жүктейміз
      } else {
        showToast(res?.error || (isRu ? "Ошибка при добавлении" : "Қосу кезінде қате шықты"), "error");
      }
    } catch (err) {
      console.error("Add organizer error:", err);
      showToast(isRu ? "Ошибка сервера" : "Серверде қате орын алды", "error");
    }
  };

  // ⚡ ҰЙЫМДЫ ӨҢДЕУ
  const handleUpdateOrganizerSubmit = async (e) => {
    e.preventDefault();
    if (!editingOrg) return;

    setSavingEdit(true);
    try {
      const res = await updateOrganizer({
        id: editingOrg.id,
        name: editingOrg.name,
        email: editingOrg.email,
        phone: editingOrg.phone,
      });

      if (res?.ok) {
        showToast(isRu ? "Данные обновлены!" : "Деректер жаңартылды!", "success");
        setEditingOrg(null);
        await loadData();
      } else {
        showToast(res?.error || (isRu ? "Ошибка обновления" : "Жаңарту қатесі"), "error");
      }
    } catch (err) {
      console.error("Update error:", err);
      showToast(isRu ? "Ошибка сервера" : "Серверде қате орын алды", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // ⚡ ҰЙЫМДЫ ӨШІРУ
  const handleDeleteOrganizerConfirm = async () => {
    if (!deletingOrg) return;

    setSavingDelete(true);
    try {
      const res = await deleteOrganizer(deletingOrg.id);
      if (res?.ok) {
        showToast(isRu ? "Организация удалена" : "Ұйым өшірілді", "success");
        setDeletingOrg(null);
        await loadData();
      } else {
        showToast(res?.error || (isRu ? "Ошибка при удалении" : "Өшіру кезінде қате шықты"), "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToast(isRu ? "Ошибка сервера" : "Серверде қате орын алды", "error");
    } finally {
      setSavingDelete(false);
    }
  };

  if (loading) return <LoadingState />;

  const filtered = organizers.filter(
    (o) =>
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.email?.toLowerCase().includes(search.toLowerCase()) ||
      o.phone?.includes(search)
  );

  return (
    <div className="space-y-6 w-full pb-12 font-sans text-slate-900 relative">
      {/* 🔔 TOAST ХАБАРЛАМА */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl text-xs font-bold border transition-all animate-bounce ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isRu ? "Организаторы" : "Организаторлар"}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {isRu
              ? "B2B клиенты, арендующие платформу (Аккаунты организаторов)."
              : "Платформаны жалға алған B2B клиенттер (Организатор аккаунттары)."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={isRu ? "Имя, email, телефон..." : "Аты, email, телефон..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md shadow-purple-200"
          >
            <Plus size={16} />
            {isRu ? "Добавить Организатора" : "Организатор Қосу"}
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">{isRu ? "Организатор" : "Организатор"}</th>
                <th className="px-6 py-4">{isRu ? "Контакты" : "Байланыс Мәліметі"}</th>
                <th className="px-6 py-4 text-center">{isRu ? "Марафоны" : "Марафондар"}</th>
                <th className="px-6 py-4 text-center">{isRu ? "Кол-во учеников" : "Оқушылар Саны"}</th>
                <th className="px-6 py-4 text-right">{isRu ? "Действия" : "Әрекеттер"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    {isRu ? "Организаторы не найдены." : "Организаторлар табылмады."}
                  </td>
                </tr>
              ) : (
                filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl">
                        <UserCheck size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900">{org.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          ORGANIZER ROLE
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400" />
                        {org.email}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" />
                        {org.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl font-bold text-[11px]">
                        {org.marathonsCount} {isRu ? "марафон(ов)" : "марафон"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[11px]">
                        {org.studentsCount} {isRu ? "учеников" : "оқушы"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* ӨҢДЕУ БАТЫРМАСЫ */}
                        <button
                          onClick={() => setEditingOrg({ ...org })}
                          title={isRu ? "Редактировать" : "Өңдеу"}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>

                        {/* ӨШІРУ БАТЫРМАСЫ */}
                        <button
                          onClick={() => setDeletingOrg(org)}
                          title={isRu ? "Удалить" : "Өшіру"}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>

                        {/* КАБИНЕТКЕ КІРУ */}
                        <button
                          onClick={() => handleImpersonate(org.id)}
                          disabled={actionId === org.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          {actionId === org.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5" />
                          )}
                          {isRu ? "Войти" : "Кіру"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✏️ ӨҢДЕУ МОДАЛКАСЫ */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md border border-slate-100 shadow-2xl space-y-5 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setEditingOrg(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-black text-slate-900">
              {isRu ? "Редактировать Организатора" : "Организаторды Өңдеу"}
            </h3>

            <form onSubmit={handleUpdateOrganizerSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {isRu ? "Название / Имя" : "Атауы / Аты-жөні"}
                </label>
                <input
                  type="text"
                  required
                  value={editingOrg.name || ""}
                  onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={editingOrg.email || ""}
                  onChange={(e) => setEditingOrg({ ...editingOrg, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {isRu ? "Номер телефона" : "Телефон нөмірі"}
                </label>
                <input
                  type="text"
                  required
                  value={editingOrg.phone || ""}
                  onChange={(e) => setEditingOrg({ ...editingOrg, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOrg(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {isRu ? "Отмена" : "Бас тарту"}
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isRu ? "Сохранить" : "Сақтау"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ ӨШІРУДІ РАСТАУ МОДАЛКАСЫ */}
      {deletingOrg && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm border border-slate-100 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                {isRu ? "Удалить организацию?" : "Ұйымды өшіруді растайсыз ба?"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                <strong className="text-slate-700">{deletingOrg.name}</strong> {isRu ? "будет навсегда удалена из системы." : "жүйеден толығымен өшіріледі."}
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingOrg(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {isRu ? "Отмена" : "Бас тарту"}
              </button>
              <button
                type="button"
                onClick={handleDeleteOrganizerConfirm}
                disabled={savingDelete}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {savingDelete && <Loader2 size={14} className="animate-spin" />}
                {isRu ? "Удалить" : "Өшіру"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddOrganizerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCheckUser={handleCheckUser}
        onAddOrganizer={handleAddOrganizer}
      />
    </div>
  );
}