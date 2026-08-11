"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { 
  Plus, Edit3, Trash2, Loader2, Save, Trophy, BookOpen, X, Video, FileText, Clock, CalendarDays, Sparkles, AlertCircle
} from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import CustomDatePicker from "@/components/CustomDatePicker";
import LoadingState from "@/components/LoadingState";

export default function AdminTasksPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const { orgId } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [marathons, setMarathons] = useState([]);
  const [selectedMarathon, setSelectedMarathon] = useState(null);
  const [existingTasks, setExistingTasks] = useState([]);
  
  const [activeDay, setActiveDay] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title: "",
    videoUrl: "",
    content: "",
    points: 10,
    verificationType: "TEST",
    status: "PUBLISHED",
    availableAt: "",
    deadlineAt: "",
  });

  // 1. Марафонның тапсырмаларын жүктеу
  const loadTasksForMarathon = async (marathonId) => {
    try {
      if (actions.getTasksByMarathonId) {
        const tasks = await actions.getTasksByMarathonId(marathonId);
        setExistingTasks(tasks || []);
      } else {
        const res = await fetch(`/api/org/tasks?marathonId=${marathonId}`);
        const json = await res.json();
        if (json.ok) setExistingTasks(json.tasks || []);
      }
    } catch (err) {
      console.error("Load tasks error:", err);
    }
  };

  // 2. Тек белсенді марафондарды тікелей жүктеу
  const fetchMarathonsAndTasks = useCallback(async () => {
    setLoading(true);
    try {
      let list = [];
      if (actions.getMarathonsByOrgId) {
        list = await actions.getMarathonsByOrgId(orgId);
      } else {
        const res = await fetch(`/api/org/groups?orgId=${orgId}`);
        const json = await res.json();
        if (json.ok) list = json.marathons || [];
      }

      setMarathons(list || []);
      if (list && list.length > 0) {
        const firstM = list[0];
        setSelectedMarathon(firstM);
        await loadTasksForMarathon(firstM.id);
      } else {
        setSelectedMarathon(null);
        setExistingTasks([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchMarathonsAndTasks();
  }, [fetchMarathonsAndTasks]);

  const handleMarathonChange = async (mId) => {
    const found = marathons.find((m) => String(m.id) === String(mId));
    if (found) {
      setSelectedMarathon(found);
      setActiveDay(1);
      await loadTasksForMarathon(found.id);
    }
  };

  const handleOpenDayModal = (dayNum) => {
    setActiveDay(dayNum);
    setEditingTaskId(null);
    setTaskForm({
      title: "",
      videoUrl: "",
      content: "",
      points: 10,
      verificationType: "TEST",
      status: "PUBLISHED",
      availableAt: "",
      deadlineAt: "",
    });
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setActiveDay(task.dayNumber);
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title || "",
      videoUrl: task.videoUrl || "",
      content: task.content || "",
      points: task.points || 10,
      verificationType: task.verificationType || "TEST",
      status: task.status || "PUBLISHED",
      availableAt: task.availableAt ? new Date(task.availableAt).toISOString().slice(0, 16) : "",
      deadlineAt: task.deadlineAt ? new Date(task.deadlineAt).toISOString().slice(0, 16) : "",
    });
    setShowModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm(isRu ? "Вы действительно хотите удалить это задание?" : "Осы тапсырманы өшіргіңіз келе ме?")) return;
    try {
      const fn = actions.deleteTaskAction || actions.deleteTask;
      if (fn) {
        const res = await fn(taskId);
        if (res?.ok || res?.success) {
          await loadTasksForMarathon(selectedMarathon.id);
        } else {
          alert((isRu ? "Ошибка удаления: " : "Өшіру қателігі: ") + (res?.error || (isRu ? "Неизвестная ошибка" : "Белгісіз қате")));
        }
      }
    } catch (err) {
      console.error("Delete task error:", err);
    }
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!selectedMarathon || !taskForm.title.trim() || saving) return;

    setSaving(true);
    try {
      const fn = actions.saveTaskAction || actions.upsertTask;
      if (!fn) {
        alert(isRu ? "Функция сохранения задания не найдена" : "Тапсырманы сақтау функциясы табылмады");
        return;
      }

      const res = await fn({
        id: editingTaskId,
        marathonId: selectedMarathon.id,
        dayNumber: Number(activeDay),
        ...taskForm,
        points: Number(taskForm.points) || 10,
      });

      if (res?.ok || res?.id || res?.success) {
        setShowModal(false);
        await loadTasksForMarathon(selectedMarathon.id);
      } else {
        alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || (isRu ? "Не удалось сохранить" : "Сақтау мүмкін болмады")));
      }
    } catch (err) {
      console.error("Save task error:", err);
    } finally {
      setSaving(false);
    }
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(isRu ? "ru-RU" : "kk-KZ", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // ДЕДЛАЙНДЫ БЫСТРЫЙ ПРЕCЕТПЕН ОРНАТУ
  const applyQuickPreset = (daysToAdd, setHours = 23, setMinutes = 59) => {
    const now = new Date();
    now.setDate(now.getDate() + daysToAdd);
    now.setHours(setHours, setMinutes, 0, 0);
    const formatted = now.toISOString().slice(0, 16);
    setTaskForm((prev) => ({ ...prev, deadlineAt: formatted }));
  };

  if (loading) {
    return <LoadingState />;
  }

  const duration = selectedMarathon?.durationDays || 21;
  const daysArray = Array.from({ length: duration }, (_, i) => i + 1);

  return (
    <div className="space-y-6 w-full pb-12 font-sans text-slate-900">
      {/* 1. БӨЛІМ ШАПКАСЫ */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-extrabold rounded-xl border border-purple-100">
            {isRu ? "Конструктор Заданий" : "Тапсырмалар Конструкторы"}
          </span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-2">
            {isRu ? "Управление ежедневными заданиями" : "Күнделікті Тапсырмаларды Басқару"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isRu
              ? "Добавляйте любое количество заданий на 1 день, настраивайте отдельное видео, инструкцию и баллы."
              : "1 күнге қалағанша тапсырма қосып, әрқайсысына жеке видео, нұсқаулық және балл белгілей аласыз."}
          </p>
        </div>

        {marathons.length > 0 ? (
          <div className="w-full sm:w-64 shrink-0">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
              {isRu ? "Выберите марафон" : "Марафонды Таңдаңыз"}
            </label>
            <select
              value={selectedMarathon?.id || ""}
              onChange={(e) => handleMarathonChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-purple-600 cursor-pointer"
            >
              {marathons.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.durationDays || 21} {isRu ? "дней" : "күн"})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-xs font-bold text-purple-600 bg-purple-50 px-4 py-2.5 rounded-xl border border-purple-100">
            {isRu ? "Нет активных марафонов" : "Белсенді марафондар жоқ"}
          </div>
        )}
      </div>

      {/* 2. КҮНДЕР СЕТКАСЫ ЖӘНЕ ТАПСЫРМАЛАР ТІЗІМІ */}
      {!selectedMarathon ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-purple-600 mx-auto" />
          <h3 className="font-bold text-gray-900 text-lg">
            {isRu ? "Активный марафон не выбран" : "Белсенді марафон таңдалмаған"}
          </h3>
          <p className="text-xs text-gray-400">
            {isRu
              ? "Создайте или выберите марафон, чтобы начать добавлять задания."
              : "Тапсырмалар қосу үшін алдымен марафонды құрыңыз немесе таңдаңыз."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {daysArray.map((dayNum) => {
            const dayTasks = existingTasks.filter((t) => Number(t.dayNumber) === Number(dayNum));

            return (
              <div
                key={dayNum}
                className="p-5 rounded-3xl border border-gray-100 bg-white space-y-3 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-purple-600 text-white">
                    {dayNum}-{isRu ? "День" : "Күн"}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {dayTasks.length} {isRu ? "заданий" : "тапсырма"}
                  </span>
                </div>

                <div className="space-y-2 min-h-[80px]">
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-gray-300 italic pt-3 text-center">
                      {isRu ? "Заданий пока нет..." : "Тапсырмалар әлі жоқ..."}
                    </p>
                  ) : (
                    dayTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100/60 flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate">{t.title}</div>
                          <div className="flex flex-col gap-0.5 text-[10px] font-bold text-gray-500">
                            <span className="text-amber-700 flex items-center gap-0.5">
                              <Trophy className="w-3 h-3 text-amber-500" />
                              +{t.points} XP
                            </span>
                            {t.deadlineAt && (
                              <span className="flex items-center gap-0.5 text-purple-600 font-extrabold">
                                <Clock className="w-3 h-3" />
                                {isRu ? "Дедлайн: " : "Дедлайн: "}{formatDateLabel(t.deadlineAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditTask(t)}
                            className="p-1.5 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors cursor-pointer"
                            title={isRu ? "Редактировать" : "Өңдеу"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title={isRu ? "Удалить" : "Өшіру"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => handleOpenDayModal(dayNum)}
                  className="w-full py-2 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 border border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {isRu ? "Добавить задание" : "Тапсырма Қосу"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. ТАПСЫРМА ҚОСУ / ӨҢДЕУ МОДАЛІ */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-purple-600 uppercase bg-purple-50 px-2.5 py-1 rounded-md">
                  {activeDay}-{isRu ? "День: Задание" : "Күнге Тапсырма"}
                </span>
                <h3 className="text-base font-extrabold text-gray-900 mt-1.5">
                  {editingTaskId
                    ? (isRu ? "Редактирование задания" : "Тапсырманы Өңдеу")
                    : (isRu ? "Добавление нового задания" : "Жаңа Тапсырма Қосу")}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isRu ? "Название задания *" : "Тапсырма Тақырыбы *"}
                </label>
                <input
                  type="text"
                  placeholder={isRu ? "Например: Просмотр видеоурока или Написание конспекта" : "Мысалы: Видео сабақты көру немесе Конспект жазу"}
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    {isRu ? "Начисляемые баллы (XP) *" : "Берілетін Балл (XP) *"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={taskForm.points}
                      onChange={(e) => setTaskForm({ ...taskForm, points: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 pl-9"
                      required
                    />
                    <Trophy className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    {isRu ? "Статус" : "Күйі"}
                  </label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="PUBLISHED">{isRu ? "Опубликовано" : "Жарияланған"}</option>
                    <option value="DRAFT">{isRu ? "Черновик" : "Черновик"}</option>
                  </select>
                </div>
              </div>

              {/* ⚡ ЗАМАНАУИ ДЕДЛАЙН ЖӘНЕ УАҚЫТ КАРТОЧКАСЫ */}
<div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3.5">
  <div className="flex items-center justify-between">
    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
      <CalendarDays size={15} className="text-purple-600" />
      {isRu ? "Срок открытия и Дедлайн" : "Ашылу мерзімі мен Дедлайн"}
    </span>

    {/* Быстрый Пресеттер */}
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => applyQuickPreset(1, 23, 59)}
        className="px-2.5 py-1 bg-white hover:bg-purple-600 hover:text-white text-[10px] font-extrabold text-purple-700 rounded-xl border border-purple-200 transition cursor-pointer shadow-2xs"
      >
        {isRu ? "+1 день" : "+1 күн"}
      </button>
      <button
        type="button"
        onClick={() => applyQuickPreset(3, 23, 59)}
        className="px-2.5 py-1 bg-white hover:bg-purple-600 hover:text-white text-[10px] font-extrabold text-purple-700 rounded-xl border border-purple-200 transition cursor-pointer shadow-2xs"
      >
        {isRu ? "+3 дня" : "+3 күн"}
      </button>
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {/* Ашылуы */}
    <CustomDatePicker
      label={isRu ? "Открытие ученикам" : "Оқушыларға ашылуы"}
      value={taskForm.availableAt}
      onChange={(val) => setTaskForm({ ...taskForm, availableAt: val })}
      color="purple"
      isRu={isRu}
    />

    {/* Дедлайн */}
    <CustomDatePicker
      label={isRu ? "Дедлайн сдачи" : "Дедлайн (Соңғы сәт)"}
      value={taskForm.deadlineAt}
      onChange={(val) => setTaskForm({ ...taskForm, deadlineAt: val })}
      color="rose"
      isRu={isRu}
    />
  </div>
</div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1">
                  <Video size={13} /> {isRu ? "Ссылка на видео (YouTube / Loom)" : "Видео Сілтемесі (YouTube / Loom)"}
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={taskForm.videoUrl}
                  onChange={(e) => setTaskForm({ ...taskForm, videoUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1">
                  <FileText size={13} /> {isRu ? "Инструкция и текст" : "Нұсқаулық пен Мәтін"}
                </label>
                <textarea
                  rows={3}
                  placeholder={isRu ? "Напишите инструкцию по выполнению задания..." : "Осы тапсырманы қалай орындау керектігін жазыңыз..."}
                  value={taskForm.content}
                  onChange={(e) => setTaskForm({ ...taskForm, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isRu ? "Тип проверки" : "Тексеру Түрі"}
                </label>
                <select
                  value={taskForm.verificationType}
                  onChange={(e) => setTaskForm({ ...taskForm, verificationType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="TEST">{isRu ? "Чек-лист (Интерактив)" : "Чек-лист (Интерактив)"}</option>
                  <option value="SCREENSHOT">{isRu ? "Скриншот / Загрузка файла" : "Скриншот / Файл Жүктеу"}</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  {isRu ? "Отмена" : "Бас тарту"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-40 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving
                    ? (isRu ? "Сохранение..." : "Сақталуда...")
                    : (isRu ? "Сохранить" : "Сақтау")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}