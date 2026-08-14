"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  Plus, Users, BookOpen, Sparkles, Trash2, Loader2, X, AlertTriangle, 
  Settings, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, ChevronUp, ChevronDown
} from "lucide-react";
import { useData } from "@/context/DataContext";
import LoadingState from "@/components/LoadingState";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

// --- 1. CustomDatePicker ---
function CustomDatePicker({ value, onChange, label, isRu = true }) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);

  const calendarRef = useRef(null);
  const timeRef = useRef(null);

  const dateObj = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(isNaN(dateObj.getTime()) ? new Date() : dateObj);

  const initialTime = value && value.includes("T") ? value.split("T")[1]?.slice(0, 5) || "09:00" : "09:00";
  const [hours, setHours] = useState(initialTime.split(":")[0] || "09");
  const [minutes, setMinutes] = useState(initialTime.split(":")[1] || "00");

  useEffect(() => {
    if (value && value.includes("T")) {
      const timePart = value.split("T")[1]?.slice(0, 5) || "09:00";
      const [h, m] = timePart.split(":");
      setHours(h || "09");
      setMinutes(m || "00");
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setIsCalendarOpen(false);
      }
      if (timeRef.current && !timeRef.current.contains(e.target)) {
        setIsTimeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectDay = (day) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const existingTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, "0");
    const dateStr = String(day).padStart(2, "0");

    onChange(`${year}-${month}-${dateStr}T${existingTime}`);
    setIsCalendarOpen(false);
  };

  const updateExactTime = (newH, newM) => {
    let h = parseInt(newH, 10);
    let m = parseInt(newM, 10);

    if (isNaN(h)) h = 0;
    if (isNaN(m)) m = 0;

    if (h < 0) h = 23;
    if (h > 23) h = 0;
    if (m < 0) m = 59;
    if (m > 59) m = 0;

    const formattedH = String(h).padStart(2, "0");
    const formattedM = String(m).padStart(2, "0");

    setHours(formattedH);
    setMinutes(formattedM);

    let existingDate = new Date().toISOString().split("T")[0];
    if (value && value.includes("T")) {
      existingDate = value.split("T")[0];
    }
    onChange(`${existingDate}T${formattedH}:${formattedM}`);
  };

  const adjustHours = (delta) => updateExactTime(parseInt(hours, 10) + delta, minutes);
  const adjustMinutes = (delta) => updateExactTime(hours, parseInt(minutes, 10) + delta);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNamesRu = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const monthNamesKz = ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"];
  const weekDays = isRu ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] : ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"];
  const timePresets = ["08:00", "09:00", "10:00", "12:00", "15:00", "18:00", "20:00", "21:00", "23:59"];

  let formattedDate = isRu ? "Выберите дату" : "Күнді таңдаңыз";
  if (value) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString(isRu ? "ru-RU" : "kk-KZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  }

  return (
    <div className="space-y-1 font-sans">
      <label className="block text-[10px] font-black uppercase text-purple-600">
        {label}
      </label>

      <div className="flex items-center gap-1.5">
        <div className="relative flex-1" ref={calendarRef}>
          <button
            type="button"
            onClick={() => {
              setIsCalendarOpen(!isCalendarOpen);
              setIsTimeOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-purple-400 rounded-xl text-xs font-bold text-slate-800 transition cursor-pointer"
          >
            <span className="truncate">{formattedDate}</span>
            <CalendarIcon size={14} className="text-purple-600" />
          </button>

          {isCalendarOpen && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-64 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-black text-slate-800">
                  {isRu ? monthNamesRu[month] : monthNamesKz[month]} {year}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {weekDays.map((w, idx) => (
                  <span key={idx} className="text-[10px] font-bold text-slate-400">{w}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const isSelected =
                    value &&
                    new Date(value).getDate() === d &&
                    new Date(value).getMonth() === month &&
                    new Date(value).getFullYear() === year;

                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSelectDay(d)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? "bg-purple-600 text-white shadow-xs"
                          : "hover:bg-purple-50 text-slate-700 hover:text-purple-700"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={timeRef}>
          <button
            type="button"
            onClick={() => {
              setIsTimeOpen(!isTimeOpen);
              setIsCalendarOpen(false);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-purple-400 rounded-xl text-xs font-bold text-slate-800 transition cursor-pointer"
          >
            <span>{`${hours}:${minutes}`}</span>
            <Clock size={13} className="text-slate-400" />
          </button>

          {isTimeOpen && (
            <div className="absolute top-full right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-56 animate-in fade-in zoom-in-95 duration-150 space-y-3">
              <span className="block text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 pb-1">
                {isRu ? "Выберите время старта" : "Басталу уақытын таңдаңыз"}
              </span>

              <div className="flex items-center justify-center gap-3 py-1">
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustHours(1)}
                    className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <input
                    type="text"
                    value={hours}
                    onChange={(e) => updateExactTime(e.target.value, minutes)}
                    className="w-11 h-10 bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl text-center text-sm font-black text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustHours(-1)}
                    className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{isRu ? "Час" : "Сағат"}</span>
                </div>

                <span className="text-xl font-black text-slate-400 mb-5">:</span>

                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustMinutes(5)}
                    className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <input
                    type="text"
                    value={minutes}
                    onChange={(e) => updateExactTime(hours, e.target.value)}
                    className="w-11 h-10 bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl text-center text-sm font-black text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustMinutes(-5)}
                    className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{isRu ? "Мин" : "Мин"}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">
                  {isRu ? "Быстрый выбор:" : "Тез таңдау:"}
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {timePresets.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const [h, m] = t.split(":");
                        updateExactTime(h, m);
                        setIsTimeOpen(false);
                      }}
                      className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        `${hours}:${minutes}` === t
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 2. TenantAdminHome ---
export default function TenantAdminHome({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const orgId = resolvedParams?.orgId;

  const { ready, tick, triggerUpdate } = useData();
  const [marathons, setMarathons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMarathon, setEditingMarathon] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    startDate: "",
    durationDays: 21,
    status: "ACTIVE",
  });

  const loadMarathons = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      if (typeof actions.getMarathonsByOrgId === "function") {
        const res = await actions.getMarathonsByOrgId(orgId);
        setMarathons([...(res || [])]);
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

  const handleOpenEdit = (marathon) => {
    setEditingMarathon(marathon);

    let startIso = new Date().toISOString().slice(0, 16);
    if (marathon.startDate) {
      const d = new Date(marathon.startDate);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const h = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        startIso = `${y}-${m}-${day}T${h}:${min}`;
      }
    }

    setEditForm({
      title: marathon.title || "",
      description: marathon.description || "",
      startDate: startIso,
      durationDays: marathon.durationDays || 21,
      status: marathon.status || "ACTIVE",
    });
    setShowEditModal(true);
  };

  // Өзгерістерді сақтау (Лезде экранға шығару)
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingMarathon || saving) return;

    setSaving(true);
    try {
      if (typeof actions.updateMarathon === "function") {
        let finalDate = new Date().toISOString();
        if (editForm.startDate) {
          const d = new Date(editForm.startDate);
          if (!isNaN(d.getTime())) {
            finalDate = d.toISOString();
          }
        }

        const res = await actions.updateMarathon(editingMarathon.id, {
          title: editForm.title,
          description: editForm.description,
          startDate: finalDate,
          durationDays: Number(editForm.durationDays),
          status: editForm.status,
        });

        if (res?.ok) {
          setShowEditModal(false);

          // Стейттегі марафонды серверден келген немесе формадағы жаңа дерекпен дереу алмастырамыз:
          setMarathons((prev) =>
            prev.map((m) =>
              m.id === editingMarathon.id
                ? (res.marathon || {
                    ...m,
                    title: editForm.title,
                    description: editForm.description,
                    startDate: finalDate,
                    durationDays: Number(editForm.durationDays),
                    status: editForm.status,
                  })
                : m
            )
          );

          await loadMarathons();
          if (triggerUpdate) triggerUpdate();
        } else {
          alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || "Не удалось сохранить"));
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      alert(isRu ? "Ошибка сервера" : "Серверлік қате");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId || deleting) return;

    setDeleting(true);
    try {
      if (typeof actions.deleteMarathon === "function") {
        const res = await actions.deleteMarathon(deleteConfirmId);
        if (res?.ok) {
          setDeleteConfirmId(null);
          await loadMarathons();
          if (triggerUpdate) triggerUpdate();
        } else {
          alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || "Өшіру мүмкін болмады"));
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  if (!ready || loading) return <LoadingState />;

  const totalStudents = marathons.reduce((acc, m) => acc + (m.studentsCount || m._count?.students || m.students?.length || 0), 0);
  const activeMarathons = marathons.filter((m) => {
    const rawStatus = String(m.status || "ACTIVE").toUpperCase();
    return rawStatus === "ACTIVE" || rawStatus === "АКТИВНЫЙ";
  }).length;

  return (
    <div className="w-full space-y-6 font-sans text-slate-900 pb-12">
      {/* 1. Тақырып */}
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
        <Link href={`/${lang}/org/${orgId}/admin/marathons/new`}>
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

      {/* 3. Марафондар Тізімі */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {marathons.map((marathon) => {
          const studentsCount = marathon.studentsCount ?? marathon._count?.students ?? marathon.students?.length ?? 0;
          
          const filledDaysCount = marathon.filledDays ?? (
            marathon.tasks && Array.isArray(marathon.tasks) && marathon.tasks.length > 0
              ? new Set(marathon.tasks.map((t) => t.dayNumber)).size
              : (marathon.tasksCount ?? marathon._count?.tasks ?? marathon.tasks?.length ?? 0)
          );

          // 🎯 ҚАУІПСІЗ СТАТУС ТЕКСЕРІСІ:
          const rawStatus = String(marathon.status || "ACTIVE").toUpperCase();
          const isCompleted = rawStatus === "COMPLETED";
          const isDraft = rawStatus === "DRAFT";
          const isActive = !isCompleted && !isDraft;

          let statusText = isRu ? "Активный" : "Белсенді";
          if (isDraft) statusText = isRu ? "Черновик" : "Черновик";
          if (isCompleted) statusText = isRu ? "Завершён" : "Аяқталған";

          // 🎯 ДАТАНЫ ҚАУІПСІЗ ОҚУ
          let startDateFormatted = "—";
          if (marathon.startDate) {
            const d = new Date(marathon.startDate);
            if (!isNaN(d.getTime())) {
              startDateFormatted = d.toLocaleString(isRu ? "ru-RU" : "kk-KZ", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
            }
          }

          return (
            <div key={marathon.id} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-full space-y-4 relative hover:border-purple-200 transition-all">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <Link 
                    href={`/${lang}/org/${orgId}/admin/marathons/${marathon.id}`}
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
                      title={isRu ? "Настройки марафона" : "Марафон баптаулары"}
                    >
                      <Settings size={16} />
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
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium flex-wrap gap-2">
                <span className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Users size={15} className="text-purple-600" /> {studentsCount} {isRu ? "учеников" : "оқушы"}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={15} className="text-slate-400" />
                  <strong>{filledDaysCount}</strong> / {marathon.durationDays || 21} {isRu ? "дней готово" : "күн дайын"}
                </span>
                <span className="text-purple-700 font-bold flex items-center gap-1 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                  <Clock size={13} /> {isRu ? "Старт: " : "Басталуы: "} {startDateFormatted}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Өңдеу Модалі */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isRu ? "Редактирование марафона" : "Марафонды өңдеу"}
                </h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRu ? "Название марафона *" : "Марафон Атауы *"}
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-purple-600 focus:bg-white transition text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRu ? "Описание" : "Сипаттамасы"}
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-purple-600 focus:bg-white transition text-xs"
                  />
                </div>
              </div>

              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl">
                <CustomDatePicker
                  label={isRu ? "Дата и время старта *" : "Басталатын күні мен уақыты *"}
                  value={editForm.startDate}
                  onChange={(newDateTime) => setEditForm({ ...editForm, startDate: newDateTime })}
                  isRu={isRu}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRu ? "Длительность (Дней)" : "Ұзақтығы (Күн)"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={editForm.durationDays}
                    onChange={(e) => setEditForm({ ...editForm, durationDays: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-purple-600 transition text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRu ? "Статус марафона" : "Марафон мәртебесі"}
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-purple-600 cursor-pointer text-xs"
                  >
                    <option value="ACTIVE">{isRu ? "Активный (Active)" : "Белсенді (Active)"}</option>
                    <option value="DRAFT">{isRu ? "Черновик (Draft)" : "Черновик (Draft)"}</option>
                    <option value="COMPLETED">{isRu ? "Завершён (Completed)" : "Аяқталған (Completed)"}</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  {isRu ? "Отмена" : "Бас тарту"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? (isRu ? "Сохранение..." : "Сақталуда...") : (isRu ? "Сохранить изменения" : "Өзгерістерді сақтау")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Өшіру Модалі */}
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
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : (isRu ? "Да, удалить" : "Иә, Өшіру")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}