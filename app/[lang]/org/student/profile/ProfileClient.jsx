"use client";

import React, { useState } from "react";
import { 
  User, Mail, Phone, Target, Award, Flame, 
  CheckCircle2, Sparkles, ShieldCheck, Edit3,
  BookOpen, ExternalLink, Send, Globe, Video, PlaySquare, Save, Loader2, Lock
} from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

export default function ProfileClient({ initialStudent }) {
  const { lang, changeLanguage, t } = useLanguage();
  const isRu = lang === "ru";

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const completedSubmissions = initialStudent?.submissions?.filter(s => s.status === "SUBMITTED" || s.status === "APPROVED")?.length || 0;
  const matrixCount = initialStudent?.matrixTasks?.length || 0;
  const points = initialStudent?.points || 0;
  const currentStreak = Math.floor(points / 10);

  const defaultName = isRu ? "Имя не указано" : "Аты-жөні көрсетілмеген";
  const defaultGroup = isRu ? "Не прикреплён к группе" : "Топқа бекітілмеген";

  const [student, setStudent] = useState({
    id: initialStudent?.id || "",
    name: initialStudent?.name || defaultName,
    email: initialStudent?.email || "—",
    phone: initialStudent?.phone || "—",
    targetUniversity: initialStudent?.targetUniversity || "КБТУ",
    targetMajor: initialStudent?.targetMajor || "ВТиПО",
    targetScore: initialStudent?.targetScore || 135,
    currentStreak: currentStreak,
    totalPoints: points,
    completedTasks: completedSubmissions,
    group: initialStudent?.group && initialStudent.group !== "Альфа тобы" 
      ? initialStudent.group 
      : initialStudent?.marathon?.title || defaultGroup,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updateFn = actions.updateStudentProfile || actions.updateStudentProfileAction;
      if (typeof updateFn === "function") {
        const res = await updateFn({
          id: student.id,
          name: student.name,
          targetUniversity: student.targetUniversity,
          targetMajor: student.targetMajor,
          targetScore: Number(student.targetScore),
        });

        if (res?.ok) {
          setIsEditing(false);
        } else {
          alert((isRu ? "Произошла ошибка: " : "Қате шықты: ") + (res?.error || (isRu ? "Неизвестная ошибка" : "Белгісіз қате")));
        }
      } else {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Сақтау қатесі:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const badges = [
    { 
      id: 1, 
      name: isRu ? "Первый шаг" : "Алғашқы Қадам", 
      desc: isRu ? "Сдано 1-е задание" : "1-ші есеп тапсырылды", 
      icon: "🚀", 
      unlocked: completedSubmissions >= 1 
    },
    { 
      id: 2, 
      name: isRu ? "Хранитель огня" : "От Егесі", 
      desc: isRu ? "Собрано 100+ XP" : "100+ XP жиналды", 
      icon: "🔥", 
      unlocked: points >= 100 
    },
    { 
      id: 3, 
      name: isRu ? "Тайм Мастер" : "Тайм Мастер", 
      desc: isRu ? "Создано задание в матрице" : "Матрица тапсырмасы құрылды", 
      icon: "🎯", 
      unlocked: matrixCount >= 1 
    },
    { 
      id: 4, 
      name: isRu ? "Активный участник" : "Белсенді Қатысушы", 
      desc: isRu ? "Сдано более 5 заданий" : "5-тен астам есеп тапсырылды", 
      icon: "🏆", 
      unlocked: completedSubmissions >= 5 
    },
    { 
      id: 5, 
      name: isRu ? "Легенда марафона" : "Марафон Легендасы", 
      desc: isRu ? "21 день без перерывов" : "21 күн үзіліссіз аяқтау", 
      icon: "👑", 
      unlocked: completedSubmissions >= 21 
    },
  ];

  const socialLinks = [
    { id: "instagram", name: "Instagram", handle: "@loopit.kz", url: "https://instagram.com", icon: Globe, color: "hover:border-pink-300 hover:bg-pink-50/50 text-pink-600", btnBg: "bg-pink-500 hover:bg-pink-600" },
    { id: "telegram", name: "Telegram Канал", handle: "t.me/loopit_official", url: "https://t.me", icon: Send, color: "hover:border-sky-300 hover:bg-sky-50/50 text-sky-500", btnBg: "bg-sky-500 hover:bg-sky-600" },
    { id: "tiktok", name: "TikTok", handle: "@loopit_app", url: "https://tiktok.com", icon: Video, color: "hover:border-gray-300 hover:bg-gray-100 text-gray-900", btnBg: "bg-gray-900 hover:bg-black" },
    { id: "youtube", name: "YouTube", handle: "Loopit Education", url: "https://youtube.com", icon: PlaySquare, color: "hover:border-red-300 hover:bg-red-50/50 text-red-600", btnBg: "bg-red-600 hover:bg-red-700" },
  ];

  return (
    <div className="space-y-6 w-full pb-6 font-sans text-slate-900">
      {/* 1. БАННЕР ЖӘНЕ АВАТАР */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
        <div className="h-32 sm:h-44 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 relative">
          <div className="absolute right-6 top-6 opacity-10">
            <Sparkles className="w-32 h-32 text-white" />
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-purple-100 border-4 border-white text-purple-700 font-black text-3xl sm:text-4xl flex items-center justify-center shadow-lg relative shrink-0">
              {student.name.charAt(0)}
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 text-white rounded-full border-2 border-white shadow-sm" title={isRu ? "Активный студент" : "Белсенді студент"}>
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={student.name}
                    onChange={handleChange}
                    className="text-xl font-extrabold text-gray-900 tracking-tight bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 outline-none focus:border-purple-500 w-56"
                  />
                ) : (
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    {student.name}
                  </h1>
                )}
                <span className="px-3 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-full">
                  {student.group}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-500">
                {isRu ? "Подготовка к ЕНТ" : "ҰБТ дайындық"}
              </p>
            </div>
          </div>

          <button
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isEditing 
                ? "bg-purple-600 hover:bg-purple-700 text-white" 
                : "bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-700 border border-gray-200"
            }`}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {isLoading 
              ? (isRu ? "Сохранение..." : "Сақталуда...") 
              : isEditing 
              ? (t("save") || (isRu ? "Сохранить" : "Сақтау")) 
              : (isRu ? "Редактировать профиль" : "Профильді өңдеу")}
          </button>
        </div>
      </div>

      {/* 2. СТАТИСТИКА */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl shrink-0"><Flame className="w-6 h-6 fill-orange-500" /></div>
          <div>
            <div className="text-xl font-extrabold text-gray-900">{student.currentStreak} {isRu ? "дней" : "күн"}</div>
            <div className="text-xs text-gray-400 font-medium">{isRu ? "Беспрерывный стрик" : "Үздіксіз стрик"}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0"><Sparkles className="w-6 h-6 fill-purple-100" /></div>
          <div>
            <div className="text-xl font-extrabold text-purple-700">{student.totalPoints}</div>
            <div className="text-xs text-gray-400 font-medium">{isRu ? "Набранные баллы" : "Жинаған балл"}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <div className="text-xl font-extrabold text-gray-900">{student.completedTasks}</div>
            <div className="text-xs text-gray-400 font-medium">{isRu ? "Заданий выполнено" : "Тапсырма бітті"}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0"><Target className="w-6 h-6" /></div>
          <div>
            <div className="text-xl font-extrabold text-gray-900">{student.targetScore} {isRu ? "баллов" : "балл"}</div>
            <div className="text-xs text-gray-400 font-medium">{isRu ? "Цель ЕНТ" : "ҰБТ Мақсаты"}</div>
          </div>
        </div>
      </div>

      {/* 3. МАҚСАТ, ЖЕКЕ ДЕРЕКТЕР ЖӘНЕ ТІЛ ТАҢДАУ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-bold tracking-wider text-purple-300 uppercase">
                  {isRu ? "Главная академическая цель" : "Басты Академиялық Мақсат"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-purple-300">{isRu ? "Университет:" : "Университет:"}</label>
                    <input type="text" name="targetUniversity" value={student.targetUniversity} onChange={handleChange} className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-400" />
                  </div>
                  <div>
                    <label className="text-xs text-purple-300">{isRu ? "Специальность:" : "Мамандық:"}</label>
                    <input type="text" name="targetMajor" value={student.targetMajor} onChange={handleChange} className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-400" />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-black text-white leading-snug">{student.targetUniversity}</h2>
                  <p className="text-xs text-purple-200">
                    {isRu ? "Специальность: " : "Мамандық: "}
                    <span className="font-bold text-white">{student.targetMajor}</span>
                  </p>
                </>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs border-t border-white/10">
              <span className="text-purple-300">{isRu ? "Целевой балл ЕНТ:" : "Көздеген Шекі Балл:"}</span>
              {isEditing ? (
                <input type="number" name="targetScore" value={student.targetScore} onChange={handleChange} className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm font-black text-amber-400 outline-none text-right focus:border-purple-400" />
              ) : (
                <span className="text-base font-black text-amber-400">{student.targetScore} / 140</span>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-800">
              {isRu ? "Личная информация" : "Жеке Ақпарат"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <User className="w-3.5 h-3.5" /> {isRu ? "Полное имя" : "Толық Аты-Жөні"}
                </div>
                {isEditing ? <input type="text" name="name" value={student.name} onChange={handleChange} className="w-full mt-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-purple-500" /> : <p className="text-sm font-bold text-gray-800">{student.name}</p>}
              </div>

              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-1 relative">
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</div>
                  <Lock className="w-3 h-3 text-gray-400" title={isRu ? "Системная информация" : "Жүйелік ақпарат"} />
                </div>
                <p className="text-sm font-bold text-gray-600 select-none">{student.email}</p>
              </div>

              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-1 relative">
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {isRu ? "Номер телефона" : "Телефон Номер"}</div>
                  <Lock className="w-3 h-3 text-gray-400" title={isRu ? "Системная информация" : "Жүйелік ақпарат"} />
                </div>
                <p className="text-sm font-bold text-gray-600 select-none">{student.phone}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <BookOpen className="w-3.5 h-3.5" /> {isRu ? "Марафон / Группа" : "Марафон"}
                </div>
                <p className="text-sm font-bold text-purple-700">{student.group}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ТІЛ ТАҢДАУ ЖӘНЕ ЖЕТІСТІКТЕР (BADGES) */}
        <div className="space-y-6">
          {/* 🌐 Тіл Ауыстырғыш Блогы */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {t("languageSelect") || (isRu ? "Выбор языка" : "Тіл таңдау")}
                </h3>
                <p className="text-[11px] text-gray-400">
                  {isRu ? "Выберите язык интерфейса" : "Интерфейс тілін таңдаңыз"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => changeLanguage("kz")}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  lang === "kz"
                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                🇰🇿 Қазақша
              </button>

              <button
                type="button"
                onClick={() => changeLanguage("ru")}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  lang === "ru"
                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                🇷🇺 Русский
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" /> {isRu ? "Достижения" : "Жетістіктер"}
              </h3>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-xl">
                {badges.filter((b) => b.unlocked).length} / {badges.length}
              </span>
            </div>

            <div className="space-y-3">
              {badges.map((badge) => (
                <div key={badge.id} className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${badge.unlocked ? "bg-purple-50/50 border-purple-200" : "bg-gray-50/50 border-gray-100 opacity-50 grayscale"}`}>
                  <div className="text-2xl p-2 bg-white rounded-xl shadow-xs shrink-0">{badge.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-800 truncate">{badge.name}</h4>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. ӘЛЕУМЕТТІК ЖЕЛІЛЕР */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {isRu ? "Официальные страницы Loopit" : "Loopit Ресми Парақшалары"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isRu 
                ? "Не пропустите новости, полезный контент и объявления марафона!" 
                : "Жаңалықтар, пайдалы контент және марафон хабарландыруларын өткізіп алмаңыз!"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {socialLinks.map((item) => {
            const IconComponent = item.icon;
            return (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className={`p-4 rounded-2xl border border-gray-100 bg-gray-50/50 transition-all duration-200 flex items-center justify-between group ${item.color}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 text-white rounded-xl shadow-xs ${item.btnBg}`}><IconComponent className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 group-hover:text-gray-900">{item.name}</h4>
                    <p className="text-[11px] text-gray-400">{item.handle}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}