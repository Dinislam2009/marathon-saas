"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { 
  Users, Plus, Trash2, Loader2, AlertTriangle
} from "lucide-react";
import { createGroupAction, deleteGroupAction, getMarathonsByOrgId, getcuratorsByOrgId } from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import LoadingState from "@/components/LoadingState";

export default function OrganizerGroupsPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";
  const { orgId } = use(params);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [marathons, setMarathons] = useState([]);
  const [curators, setcurators] = useState([]);
  const [groups, setGroups] = useState([]);
  
  // Модальдік терезелер стейті
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Форма стейті
  const [formData, setFormData] = useState({
    name: "",
    maxSize: 30,
    marathonId: "",
    curatorId: "",
  });

  // Деректерді серверден жүктеу
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Тек базада бар белсенді марафондарды жүктеу
      const marathonsList = await getMarathonsByOrgId(orgId);
      const activeMarathons = marathonsList || [];
      setMarathons(activeMarathons);

      // 2. Кураторларды оқу
      const curatorsList = await getcuratorsByOrgId(orgId);
      setcurators(curatorsList || []);

      // 3. Топтарды алу және өшірілген марафон топтарын сүзіп тастау
      const res = await fetch(`/api/org/groups?orgId=${orgId}`);
      const json = await res.json();

      if (json.ok) {
        const validMarathonIds = new Set(activeMarathons.map((m) => m.id));
        const filteredGroups = (json.groups || []).filter((g) =>
          g.marathonId ? validMarathonIds.has(g.marathonId) : true
        );
        setGroups(filteredGroups);
      }

      if (activeMarathons.length > 0) {
        setFormData((prev) => ({
          ...prev,
          marathonId: prev.marathonId || activeMarathons[0].id,
        }));
      }
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Жаңа топ құру
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.marathonId || creating) return;

    try {
      setCreating(true);
      const res = await createGroupAction(formData);

      if (res?.ok) {
        setShowModal(false);
        setFormData({ name: "", maxSize: 30, marathonId: marathons[0]?.id || "", curatorId: "" });
        await fetchData();
      } else {
        alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || (isRu ? "Не удалось создать группу" : "Топ құру мүмкін болмады")));
      }
    } catch (err) {
      console.error("Create group error:", err);
    } finally {
      setCreating(false);
    }
  };

  // Топты өшіруді орындау
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId || deleting) return;

    try {
      setDeleting(true);
      const res = await deleteGroupAction(deleteConfirmId);
      if (res?.ok) {
        setDeleteConfirmId(null);
        await fetchData();
      } else {
        alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || (isRu ? "Не удалось удалить" : "Өшіру мүмкін болмады")));
      }
    } catch (err) {
      console.error("Delete group error:", err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
  return <LoadingState />;
}

  return (
    <div className="space-y-6 w-full pb-8 font-sans text-slate-900">
      {/* 1. ШАПКА ЖӘНЕ БАТЫРМА */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100">
            {isRu ? "Панель Организатора" : "Организатор Панелі"}
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
            {isRu ? "Управление группами марафона" : "Марафон Топтарын Басқару"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isRu
              ? "Разделяйте учеников по группам, устанавливайте вместимость и назначайте куратора."
              : "Оқушыларды топтарға бөліңіз, сиымдылығын белгілеңіз және жеке куратор тағайындаңыз."}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-2xl shadow-md shadow-purple-200 transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {isRu ? "Создать группу" : "Жаңа Топ Құру"}
        </button>
      </div>

      {/* 2. ТОПТАР ТІЗІМІ */}
      {groups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <Users className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">
            {isRu ? "Группы ещё не созданы" : "Топтар әлі құрылмаған"}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {isRu
              ? "Создайте первую группу и закрепите куратора для распределения участников."
              : "Марафон қатысушыларын реттеу үшін алғашқы топты құрыңыз және куратор бекітіңіз."}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 font-bold text-xs rounded-xl hover:bg-purple-100 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {isRu ? "Добавить первую группу" : "Алғашқы топты қосу"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            const studentCount = group.students?.length || 0;
            const percentage = Math.min(Math.round((studentCount / group.maxSize) * 100), 100);

            return (
              <div
                key={group.id}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-5 hover:border-purple-200 transition-all group relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-lg">
                      {group.marathon?.title || (isRu ? "Марафон" : "Марафон")}
                    </span>
                    <button
                      onClick={() => setDeleteConfirmId(group.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title={isRu ? "Удалить группу" : "Топты өшіру"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-purple-700 transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isRu ? "Вместимость: " : "Сиымдылығы: "}
                      <span className="font-bold text-gray-700">
                        {group.maxSize} {isRu ? "учеников" : "оқушы"}
                      </span>
                    </p>
                  </div>

                  {/* Оқушы толу индикаторы */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-gray-500">
                        {isRu ? "Зарегистрировано:" : "Тіркелген оқушы:"}
                      </span>
                      <span className="text-purple-700">{studentCount} / {group.maxSize}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Бекітілген Куратор */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0">
                      {group.curator ? group.curator.name.charAt(0) : "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {group.curator ? group.curator.name : (isRu ? "Нет куратора" : "Куратор жоқ")}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {group.curator
                          ? (isRu ? "Куратор группы" : "Топ кураторы")
                          : (isRu ? "Куратор не назначен" : "Куратор тағайындалмаған")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. ЖАҢА ТОП ҚҰРУ МОДАЛЬДІК ТЕРЕЗЕСІ */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900">
                {isRu ? "Создание новой группы" : "Жаңа Топ Құру"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isRu ? "Выберите марафон *" : "Марафонды таңдаңыз *"}
                </label>
                <select
                  value={formData.marathonId}
                  onChange={(e) => setFormData({ ...formData, marathonId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 cursor-pointer"
                  required
                >
                  {marathons.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isRu ? "Название группы *" : "Топтың Атауы *"}
                </label>
                <input
                  type="text"
                  placeholder={isRu ? "Например: Alpha Squad или KBTU Cohort" : "Мысалы: Alpha Squad немесе KBTU Cohort"}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isRu ? "Максимальное количество учеников (Вместимость)" : "Максималды оқушы саны (Сиымдылығы)"}
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={formData.maxSize}
                  onChange={(e) => setFormData({ ...formData, maxSize: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isRu ? "Назначить куратора" : "Кураторды бекіту"}
                </label>
                <select
                  value={formData.curatorId}
                  onChange={(e) => setFormData({ ...formData, curatorId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="">
                    {isRu ? "— Без куратора (Назначить позже) —" : "— Кураторсыз (Кейін бекіту) —"}
                  </option>
                  {curators.map((m) => {
                    const isAssigned = groups.some((g) => g.curatorId === m.id);
                    return (
                      <option key={m.id} value={m.id} disabled={isAssigned}>
                        {m.name} {isAssigned ? (isRu ? "— (Занят / В группе)" : "— (Бос емес / Топта бар)") : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  {isRu ? "Отмена" : "Бас тарту"}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {creating
                    ? (isRu ? "Сохранение..." : "Сақталуда...")
                    : (isRu ? "Сохранить группу" : "Топты сақтау")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ӨШІРУ МОДАЛЬДІК ТЕРЕЗЕСІ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 animate-in zoom-in duration-200 border border-rose-100">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                {isRu ? "Удаление группы" : "Топты Өшіру"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {isRu
                  ? "Вы уверены, что хотите удалить эту группу? Это действие нельзя отменить."
                  : "Осы топты өшіруге сенімдісіз бе? Бұл әрекетті қайтару мүмкін емес."}
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