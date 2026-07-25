"use client";

import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Target, 
  Award, 
  Flame, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Edit3,
  BookOpen,
  ExternalLink,
  Send,
  Globe,
  Video,
  PlaySquare
} from "lucide-react";

export default function StudentProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [student, setStudent] = useState({
    name: "Арафат",
    email: "arafat@gmail.com",
    phone: "+7 (707) 123-45-67",
    targetUniversity: "КБТУ (Қазақстан-Британ Техникалық Университеті)",
    targetMajor: "ВТиПО (Есептеу техникасы және бағдарламалық қамтамасыз ету)",
    targetScore: 135,
    currentStreak: 12,
    totalPoints: 1350,
    completedTasks: 84,
    group: "Альфа тобы",
  });

  const badges = [
    { id: 1, name: "Алғашқы Қадам", desc: "1-ші отчёт тапсырылды", icon: "🚀", unlocked: true },
    { id: 2, name: "От Егесі", desc: "10 күн қатарсыз стрик", icon: "🔥", unlocked: true },
    { id: 3, name: "Тайм Мастер", desc: "Эйзенхауэр матрицасы толтырылды", icon: "🎯", unlocked: true },
    { id: 4, name: "Топ-3 Лидер", desc: "Рейтингте үздік үштікке кіру", icon: "🏆", unlocked: true },
    { id: 5, name: "Марафон Легендасы", desc: "21 күн үзіліссіз аяқтау", icon: "👑", unlocked: false },
  ];

  const socialLinks = [
    {
      id: "instagram",
      name: "Instagram",
      handle: "@loopit.kz",
      url: "https://instagram.com",
      icon: Globe,
      color: "hover:border-pink-300 hover:bg-pink-50/50 text-pink-600",
      btnBg: "bg-pink-500 hover:bg-pink-600",
    },
    {
      id: "telegram",
      name: "Telegram Канал",
      handle: "t.me/loopit_official",
      url: "https://t.me",
      icon: Send,
      color: "hover:border-sky-300 hover:bg-sky-50/50 text-sky-500",
      btnBg: "bg-sky-500 hover:bg-sky-600",
    },
    {
      id: "tiktok",
      name: "TikTok",
      handle: "@loopit_app",
      url: "https://tiktok.com",
      icon: Video,
      color: "hover:border-gray-300 hover:bg-gray-100 text-gray-900",
      btnBg: "bg-gray-900 hover:bg-black",
    },
    {
      id: "youtube",
      name: "YouTube",
      handle: "Loopit Education",
      url: "https://youtube.com",
      icon: PlaySquare,
      color: "hover:border-red-300 hover:bg-red-50/50 text-red-600",
      btnBg: "bg-red-600 hover:bg-red-700",
    },
  ];

  return (
    <div className="space-y-6 w-full pb-6">
      {/* 1. ЖОҒАРҒЫ БАННЕР ЖӘНЕ АВАТАР */}
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
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 text-white rounded-full border-2 border-white shadow-sm" title="Белсенді студент">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  {student.name}
                </h1>
                <span className="px-3 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-full">
                  {student.group}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-500">
                Марафон қатысушысы • ҰБТ 2027 дайындық
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-700 border border-gray-200 rounded-2xl text-xs font-bold transition-all shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? "Сақтау" : "Профильді өңдеу"}
          </button>
        </div>
      </div>

      {/* 2. СТАТИСТИКА КАРТОЧКАЛАРЫ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl shrink-0">
            <Flame className="w-6 h-6 fill-orange-500" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-gray-900">{student.currentStreak} күн</div>
            <div className="text-xs text-gray-400 font-medium">Үздіксіз стрик</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0">
            <Sparkles className="w-6 h-6 fill-purple-100" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-purple-700">{student.totalPoints}</div>
            <div className="text-xs text-gray-400 font-medium">Жинаған балл</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-gray-900">{student.completedTasks}</div>
            <div className="text-xs text-gray-400 font-medium">Тапсырма бітті</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-gray-900">{student.targetScore} балл</div>
            <div className="text-xs text-gray-400 font-medium">ҰБТ Мақсаты</div>
          </div>
        </div>
      </div>

      {/* 3. НЕГІЗГІ МАҚСАТ ТАРҒЕТІ ЖӘНЕ ЖЕКЕ ДЕРЕКТЕР */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-bold tracking-wider text-purple-300 uppercase">
                  Басты Академиялық Мақсат
                </span>
              </div>
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold border border-white/20">
                2027 Мақсат
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white leading-snug">
                {student.targetUniversity}
              </h2>
              <p className="text-xs text-purple-200">
                Мамандық: <span className="font-bold text-white">{student.targetMajor}</span>
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs border-t border-white/10">
              <span className="text-purple-300">Көздеген Шекі Балл:</span>
              <span className="text-base font-black text-amber-400">{student.targetScore} / 140</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-800">Жеке Ақпарат</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <User className="w-3.5 h-3.5" />
                  Толық Аты-Жөні
                </div>
                <p className="text-sm font-bold text-gray-800">{student.name}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <Mail className="w-3.5 h-3.5" />
                  Email Почта
                </div>
                <p className="text-sm font-bold text-gray-800">{student.email}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <Phone className="w-3.5 h-3.5" />
                  Телефон Номер
                </div>
                <p className="text-sm font-bold text-gray-800">{student.phone}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <BookOpen className="w-3.5 h-3.5" />
                  Топ
                </div>
                <p className="text-sm font-bold text-purple-700">{student.group}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Жетістіктер
            </h3>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-xl">
              {badges.filter((b) => b.unlocked).length} / {badges.length}
            </span>
          </div>

          <div className="space-y-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  badge.unlocked
                    ? "bg-purple-50/50 border-purple-200"
                    : "bg-gray-50/50 border-gray-100 opacity-50 grayscale"
                }`}
              >
                <div className="text-2xl p-2 bg-white rounded-xl shadow-xs shrink-0">
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-gray-800 truncate">
                    {badge.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {badge.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. БІЗДІҢ ӘЛЕУМЕТТІК ЖЕЛІЛЕР */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Loopit Ресми Парақшалары
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Жаңалықтар, пайдалы контент және марафон хабарландыруларын өткізіп алмаңыз!
            </p>
          </div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 font-bold text-[11px] rounded-full self-start sm:self-auto">
            Ресми қауымдастық
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {socialLinks.map((item) => {
            const IconComponent = item.icon;
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 rounded-2xl border border-gray-100 bg-gray-50/50 transition-all duration-200 flex items-center justify-between group ${item.color}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 text-white rounded-xl shadow-xs ${item.btnBg}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 group-hover:text-gray-900">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-gray-400">{item.handle}</p>
                  </div>
                </div>

                <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
              </a>
            );
          })}
        </div>
      </div>

      {/* 5. FOOTER (ОРАТАСЫНА ТЕНЕЛГЕН) */}
      <footer className="pt-6 border-t border-gray-200/60 mt-10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-gray-500 font-medium text-center">
          <p>© 2026 Loopit. Все права защищены.</p>
          <span className="hidden sm:inline text-gray-300">•</span>
          <div className="flex items-center gap-3 text-gray-500">
            <a
              href="#"
              className="hover:text-purple-600 transition-colors hover:underline"
            >
              Политика конфиденциальности
            </a>
            <span>•</span>
            <a
              href="#"
              className="hover:text-purple-600 transition-colors hover:underline"
            >
              Пользовательское соглашение
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}