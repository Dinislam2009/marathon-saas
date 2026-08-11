"use client";

import { useState } from "react";
import { User, Mail, Phone, ShieldCheck, KeyRound, Save, CheckCircle, Sparkles, Lock, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminProfilePage() {
  const { lang, changeLanguage } = useLanguage();
  const isRu = lang === "ru";

  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: isRu ? "Главный Организатор" : "Бас Организатор",
    email: "organizer@loopit.kz",
    phone: "+7 (777) 000-00-00",
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="w-full space-y-6 font-sans text-slate-900 pb-12">
      {/* 1. Баннер мен Аватар */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs w-full">
        <div className="h-40 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 p-6 sm:p-8 flex justify-between items-start relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <span className="bg-white/10 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 inline-flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-300" />
              {isRu ? "Владелец платформы (Owner)" : "Платформа Иесі (Owner)"}
            </span>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-6 pt-0 flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="w-28 h-28 rounded-2xl bg-white p-2 shadow-lg relative shrink-0">
              <div className="w-full h-full rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-3xl">
                O
              </div>
            </div>
            <div className="mb-1 space-y-1">
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                {formData.name}
                <ShieldCheck size={22} className="text-purple-600" />
              </h1>
              <p className="text-xs text-slate-500 font-medium">{formData.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Профиль пішіні */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">
                {isRu ? "Данные организатора" : "Организатор деректері"}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {isRu ? "Личная информация владельца аккаунта" : "Аккаунт иесінің жеке ақпараты"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isRu ? "ФИО (Полное имя)" : "Толық аты-жөні"}
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  {isRu ? "Email адрес" : "Email мекенжайы"}
                  <Lock size={12} className="text-slate-400" />
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-slate-100/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  {isRu ? "Номер телефона" : "Телефон нөмірі"}
                  <Lock size={12} className="text-slate-400" />
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.phone}
                    readOnly
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-slate-100/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed select-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {saved ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                <CheckCircle size={16} /> {isRu ? "Успешно сохранено!" : "Сәтті сақталды!"}
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-200 transition flex items-center gap-2 cursor-pointer"
            >
              <Save size={16} />
              {isRu ? "Сохранить изменения" : "Өзгерістерді сақтау"}
            </button>
          </div>
        </div>

        {/* Оң жақ баған: Тіл таңдау & Пароль қауіпсіздігі */}
        <div className="space-y-6">
          {/* Тіл Ауыстырғыш Блогы */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isRu ? "Выбор языка интерфейса" : "Интерфейс тілін таңдау"}
                </h3>
                <p className="text-[11px] text-slate-400">
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
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                kz Қазақша
              </button>

              <button
                type="button"
                onClick={() => changeLanguage("ru")}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  lang === "ru"
                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                ru Русский
              </button>
            </div>
          </div>

          {/* Қауіпсіздік Блогы */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isRu ? "Безопасность" : "Қауіпсіздік"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isRu ? "Пароль аккаунта" : "Аккаунт паролі"}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition flex items-center justify-between cursor-pointer"
            >
              <span>{isRu ? "Изменить пароль" : "Парольді өзгерту"}</span>
              <span className="text-purple-600 font-bold">→</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}