"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { 
  Users, Plus, Trash2, Loader2, AlertTriangle, Edit3, UserPlus, 
  X, CheckCircle2, Wand2, UserCheck, ChevronRight, Mail, Phone 
} from "lucide-react";
import { 
  createGroupAction, deleteGroupAction, getMarathonsByOrgId, 
  getcuratorsByOrgId, updateGroupAction, getUnassignedStudentsAction,
  assignStudentToGroupAction, removeStudentFromGroupAction, autoDistributeStudentsAction 
} from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import LoadingState from "@/components/LoadingState";

export default function OrganizerGroupsPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";
  const { orgId } = use(params);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [autoDistributing, setAutoDistributing] = useState(false);

  const [marathons, setMarathons] = useState([]);
  const [curators, setcurators] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedMarathonFilter, setSelectedMarathonFilter] = useState("ALL");

  // Модальдік терезелер стейті
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Драуэр (Топ ішіндегі оқушылар)
  const [activeDrawerGroup, setActiveDrawerGroup] = useState(null);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  // Форма стейті
  const [formData, setFormData] = useState({
    name: "",
    maxSize: 30,
    marathonId: "",
    curatorId: "",
  });

  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    maxSize: 30,
    curatorId: "",
  });

  // Деректерді жүктеу
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const marathonsList = await getMarathonsByOrgId(orgId);
      const activeMarathons = marathonsList || [];
      setMarathons(activeMarathons);

      const curatorsList = await getcuratorsByOrgId(orgId);
      setcurators(curatorsList || []);

      const res = await fetch(`/api/org/groups?orgId=${orgId}`);
      const json = await res.json();

      if (json.ok) {
        const validMarathonIds = new Set(activeMarathons.map((m) => m.id));
        const filteredGroups = (json.groups || []).filter((g) =>
          g.marathonId ? validMarathonIds.has(g.marathonId) : true
        );
        setGroups(filteredGroups);

        // Егер Драуэр ашық болса, оның деректерін жаңарту
        if (activeDrawerGroup) {
          const fresh = filteredGroups.find((g) => g.id === activeDrawerGroup.id);
          if (fresh) setActiveDrawerGroup(fresh);
        }
      }

      if (activeMarathons.length > 0 && !formData.marathonId) {
        setFormData((prev) => ({
          ...prev,
          marathonId: activeMarathons[0].id,
        }));
      }
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId, formData.marathonId, activeDrawerGroup]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Драуэрді ашу және бос оқушыларды жүктеу
  const handleOpenDrawer = async (group) => {
    setActiveDrawerGroup(group);
    if (group.marathonId) {
      const res = await getUnassignedStudentsAction(group.marathonId);
      if (res.ok) setUnassignedStudents(res.students || []);
    }
  };

  // Оқушыны топқа қосу
  const handleAddStudentToGroup = async () => {
    if (!selectedStudentToAdd || !activeDrawerGroup || addingStudent) return;
    setAddingStudent(true);
    const res = await assignStudentToGroupAction(selectedStudentToAdd, activeDrawerGroup.id);
    if (res.ok) {
      setSelectedStudentToAdd("");
      await fetchData();
      const unassignedRes = await getUnassignedStudentsAction(activeDrawerGroup.marathonId);
      if (unassignedRes.ok) setUnassignedStudents(unassignedRes.students || []);
    } else {
      alert((isRu ? "Ошибка: " : "Қате: ") + res.error);
    }
    setAddingStudent(false);
  };

  // Оқушыны топтан шығару
  const handleRemoveStudent = async (studentId) => {
    const res = await removeStudentFromGroupAction(studentId);
    if (res.ok) {
      await fetchData();
      if (activeDrawerGroup) {
        const unassignedRes = await getUnassignedStudentsAction(activeDrawerGroup.marathonId);
        if (unassignedRes.ok) setUnassignedStudents(unassignedRes.students || []);
      }
    } else {
      alert((isRu ? "Ошибка: " : "Қате: ") + res.error);
    }
  };

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
        alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || "Топ құру мүмкін болмады"));
      }
    } catch (err) {
      console.error("Create group error:", err);
    } finally {
      setCreating(false);
    }
  };

  // Топты редакциялау
  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!editFormData.id || updating) return;

    try {
      setUpdating(true);
      const res = await updateGroupAction(editFormData.id, editFormData);
      if (res?.ok) {
        setShowEditModal(false);
        await fetchData();
      } else {
        alert((isRu ? "Ошибка: " : "Қате: ") + res.error);
      }
    } catch (err) {
      console.error("Update group error:", err);
    } finally {
      setUpdating(false);
    }
  };

  // Автоматты бөлу
  const handleAutoDistribute = async () => {
    const targetMarathonId = selectedMarathonFilter === "ALL" ? marathons[0]?.id : selectedMarathonFilter;
    if (!targetMarathonId) {
      alert(isRu ? "Выберите марафон для распределения" : "Авто-бөлу үшін марафонды таңдаңыз");
      return;
    }

    try {
      setAutoDistributing(true);
      const res = await autoDistributeStudentsAction(targetMarathonId);
      if (res?.ok) {
        alert(res.message);
        await fetchData();
      } else {
        alert((isRu ? "Ошибка: " : "Қате: ") + res.error);
      }
    } catch (err) {
      console.error("Auto distribute error:", err);
    } finally {
      setAutoDistributing(false);
    }
  };

  // Топты өшіру
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId || deleting) return;

    try {
      setDeleting(true);
      const res = await deleteGroupAction(deleteConfirmId);
      if (res?.ok) {
        setDeleteConfirmId(null);
        if (activeDrawerGroup?.id === deleteConfirmId) setActiveDrawerGroup(null);
        await fetchData();
      } else {
        alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || "Өшіру мүмкін болмады"));
      }
    } catch (err) {
      console.error("Delete group error:", err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState />;

  const filteredGroups = selectedMarathonFilter === "ALL"
    ? groups
    : groups.filter((g) => g.marathonId === selectedMarathonFilter);

  return (
    <div className="space-y-6 w-full pb-8 font-sans text-slate-900 relative">
      {/* 1. ШАПКА ЖӘНЕ СҮЗГІ / БАТЫРМАЛАР */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
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

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Марафон Сүзгісі */}
          <select
            value={selectedMarathonFilter}
            onChange={(e) => setSelectedMarathonFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-purple-600 transition cursor-pointer"
          >
            <option value="ALL">{isRu ? "Барлық марафондар" : "Барлық марафондар"}</option>
            {marathons.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>

          {/* Авто-бөлу Батырмасы */}
          <button
            onClick={handleAutoDistribute}
            disabled={autoDistributing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
            title={isRu ? "Автоматически распределить свободных учеников" : "Бос оқушыларды автоматты түрде бөлу"}
          >
            {autoDistributing ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
            {isRu ? "Авто-распределение" : "Авто-бөлу"}
          </button>

          {/* Жаңа Топ Құру Батырмасы */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-purple-200 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {isRu ? "Создать группу" : "Жаңа Топ Құру"}
          </button>
        </div>
      </div>

      {/* 2. ТОПТАР ТІЗІМІ (КАРТОЧКАЛАР) */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-xs space-y-3">
          <Users className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">
            {isRu ? "Группы еще не созданы" : "Топтар әлі құрылмаған"}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {isRu
              ? "Создайте первую группу и закрепите куратора для распределения участников."
              : "Марафон қатысушыларын реттеу үшін алғашқы топты құрыңыз және куратор бекітіңіз."}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 font-bold text-xs rounded-xl hover:bg-purple-100 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {isRu ? "Добавить первую группу" : "Алғашқы топты қосу"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const studentCount = group.students?.length || 0;
            const percentage = Math.min(Math.round((studentCount / group.maxSize) * 100), 100);
            const isFull = studentCount >= group.maxSize;

            return (
              <div
                key={group.id}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-5 hover:border-purple-200 transition relative overflow-hidden group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-lg">
                      {group.marathon?.title || "Марафон"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditFormData({
                            id: group.id,
                            name: group.name,
                            maxSize: group.maxSize,
                            curatorId: group.curatorId || "",
                          });
                          setShowEditModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition cursor-pointer"
                        title={isRu ? "Редактировать" : "Өңдеу"}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(group.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title={isRu ? "Удалить группу" : "Топты өшіру"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-purple-700 transition">
                        {group.name}
                      </h3>
                      {isFull && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black uppercase rounded-md">
                          {isRu ? "ТОЛДЫ" : "ТОЛДЫ"}
                        </span>
                      )}
                    </div>
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
                      <span className={isFull ? "text-rose-600 font-black" : "text-purple-700"}>
                        {studentCount} / {group.maxSize}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFull ? "bg-rose-500" : percentage > 80 ? "bg-amber-500" : "bg-purple-600"
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Бекітілген Куратор */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
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

                  {/* Оқушылар Тізімін Ашу Батырмасы */}
                  <button
                    onClick={() => handleOpenDrawer(group)}
                    className="w-full py-2 bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-100"
                  >
                    <Users size={14} />
                    {isRu ? `Список учеников (${studentCount})` : `Оқушылар тізімі (${studentCount})`}
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. ОҚУШЫЛАР ТІЗІМІ (SLIDE DRAWER) */}
      {activeDrawerGroup && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between space-y-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg uppercase">
                    {activeDrawerGroup.marathon?.title || "Марафон"}
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                    {activeDrawerGroup.name}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveDrawerGroup(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Куратор Мәліметі */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {isRu ? "Куратор Группы" : "Топ Кураторы"}
                </span>
                {activeDrawerGroup.curator ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <UserCheck size={16} className="text-purple-600" />
                      {activeDrawerGroup.curator.name}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Mail size={12} /> {activeDrawerGroup.curator.email}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Phone size={12} /> {activeDrawerGroup.curator.phone}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 font-semibold">
                    ⚠️ {isRu ? "Куратор не назначен." : "Куратор тағайындалмаған."}
                  </p>
                )}
              </div>

              {/* Оқушы Қосу Блогы */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  ➕ {isRu ? "Добавить ученика без группы" : "Топсыз жүрген оқушыны қосу"}
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedStudentToAdd}
                    onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="">
                      {isRu ? "— Выберите ученика —" : "— Оқушыны таңдаңыз —"}
                    </option>
                    {unassignedStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.phone || s.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddStudentToGroup}
                    disabled={!selectedStudentToAdd || addingStudent}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {addingStudent ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    {isRu ? "Добавить" : "Қосу"}
                  </button>
                </div>
              </div>

              {/* Тіркелген Оқушылар Тізімі */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  {isRu ? `Участники (${activeDrawerGroup.students?.length || 0})` : `Қатысушылар (${activeDrawerGroup.students?.length || 0})`}
                </h3>

                {activeDrawerGroup.students?.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-4 text-center">
                    {isRu ? "В этой группе пока нет учеников." : "Бұл топта әлі оқушылар жоқ."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeDrawerGroup.students?.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{st.name}</p>
                          <p className="text-[10px] text-slate-400">{st.phone || st.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(st.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title={isRu ? "Удалить из группы" : "Топтан шығару"}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setActiveDrawerGroup(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              {isRu ? "Закрыть" : "Жабу"}
            </button>
          </div>
        </div>
      )}

      {/* 4. ЖАҢА ТОП ҚҰРУ МОДАЛЬДІК ТЕРЕЗЕСІ */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
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
                  placeholder={isRu ? "Например: Alpha Squad" : "Мысалы: Alpha Squad"}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isRu ? "Максимальное количество учеников" : "Максималды оқушы саны"}
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
                    {isRu ? "— Без куратора —" : "— Кураторсыз —"}
                  </option>
                  {curators.map((c) => {
                    const isAssigned = groups.some((g) => g.curatorId === c.id);
                    return (
                      <option key={c.id} value={c.id} disabled={isAssigned}>
                        {c.name} {isAssigned ? (isRu ? "— (Занят)" : "— (Бос емес)") : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                >
                  {isRu ? "Отмена" : "Бас тарту"}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {creating ? (isRu ? "Сохранение..." : "Сақталуда...") : (isRu ? "Сохранить" : "Сақтау")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ТОПТЫ РЕДАКЦИЯЛАУ МОДАЛІ */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900">
                {isRu ? "Редактирование группы" : "Топты Өңдеу"}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isRu ? "Название группы *" : "Топтың Атауы *"}
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isRu ? "Максимальное количество учеников" : "Максималды оқушы саны"}
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={editFormData.maxSize}
                  onChange={(e) => setEditFormData({ ...editFormData, maxSize: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isRu ? "Назначить куратора" : "Кураторды бекіту"}
                </label>
                <select
                  value={editFormData.curatorId}
                  onChange={(e) => setEditFormData({ ...editFormData, curatorId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="">
                    {isRu ? "— Без куратора —" : "— Кураторсыз —"}
                  </option>
                  {curators.map((c) => {
                    const isAssigned = groups.some((g) => g.curatorId === c.id && g.id !== editFormData.id);
                    return (
                      <option key={c.id} value={c.id} disabled={isAssigned}>
                        {c.name} {isAssigned ? (isRu ? "— (Занят)" : "— (Бос емес)") : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                >
                  {isRu ? "Отмена" : "Бас тарту"}
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {updating ? (isRu ? "Сохранение..." : "Сақталуда...") : (isRu ? "Обновить" : "Жаңарту")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ӨШІРУ МОДАЛЬДІК ТЕРЕЗЕСІ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 border border-rose-100 animate-in zoom-in duration-200">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
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
                {deleting ? (isRu ? "Удаление..." : "Өшірілуде...") : (isRu ? "Да, удалить" : "Иә, Өшіру")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}