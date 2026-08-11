"use client";

import { useState } from "react";
import { Building2, Users, CreditCard, Save, CheckCircle, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminSettingsPage() {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "QADAM Academy",
    supportContact: "+7 (777) 123-45-67",
    autoAssigncurators: true,
    maxStudentsPercurator: 25,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="w-full space-y-6 font-sans text-slate-900 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {isRu ? "Настройки организатора" : "Организатор Баптаулары"}
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          {isRu
            ? "Управление правилами марафона и распределением кураторов"
            : "Марафон ережелерін және Кураторларды бөлуді реттеу"}
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* Негізгі Баптаулар (2 колонка) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Брендинг және Ақпарат */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="font-bold text-slate-900 text-lg">
                {isRu ? "Брендинг марафона" : "Марафон Брендингі"}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {isRu
                  ? "Информация, видимая ученикам и кураторам"
                  : "Оқушылар мен Кураторларға көрінетін ақпарат"}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRu ? "Название организации / академии" : "Ұйым / Академия аты"}
                </label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRu ? "Служба поддержки (WhatsApp / Тел)" : "Қолдау қызметі (WhatsApp / Тел)"}
                </label>
                <input
                  type="text"
                  value={formData.supportContact}
                  onChange={(e) => setFormData({ ...formData, supportContact: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* 2. Кураторларды бөлу ережелері */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">
                  {isRu ? "Настройка кураторов" : "Кураторларды реттеу"}
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  {isRu
                    ? "Логика распределения учеников по кураторам"
                    : "Оқушыларды Кураторларға бөлгіш логикасы"}
                </p>
              </div>
              <Users className="text-purple-600" size={20} />
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">
                    {isRu ? "Автоматическое распределение" : "Автоматты түрде бөлу"}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {isRu
                      ? "При регистрации закрплять ученика за свободным куратором"
                      : "Жаңа оқушы тіркелгенде бос кураторға бекіту"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoAssigncurators}
                  onChange={(e) => setFormData({ ...formData, autoAssigncurators: e.target.checked })}
                  className="accent-purple-600 w-5 h-5 rounded cursor-pointer"
                />
              </label>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {isRu ? "Максимум учеников на одного куратора" : "Бір кураторға максималды оқушы шегі"}
                </label>
                <input
                  type="number"
                  value={formData.maxStudentsPercurator}
                  onChange={(e) => setFormData({ ...formData, maxStudentsPercurator: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Сақтау Батырмасы */}
          <div className="flex items-center justify-between">
            {saved ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                <CheckCircle size={16} /> {isRu ? "Настройки сохранены!" : "Баптаулар сақталды!"}
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-200 transition flex items-center gap-2 cursor-pointer"
            >
              <Save size={16} /> {isRu ? "Сохранить изменения" : "Өзгерістерді сақтау"}
            </button>
          </div>

        </div>

        {/* Оң жақ: Тариф Мәртебесі (1 колонка) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isRu ? "Тариф платформы" : "Платформа Тарифі"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isRu ? "Утверждено супер-админом" : "Супер Админмен бекітілген"}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                  <Sparkles size={14} /> PRO {isRu ? "Тариф" : "Тариф"}
                </span>
                <span className="text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full uppercase">
                  {isRu ? "Активен" : "Белсенді"}
                </span>
              </div>
              <p className="text-xl font-black text-slate-900">
                49,000 ₸ <span className="text-xs text-slate-400 font-normal">/{isRu ? "мес" : "ай"}</span>
              </p>
              <p className="text-[11px] text-slate-500">
                {isRu ? "Срок: до 30.08.2026" : "Мерзімі: 30.08.2026 дейін"}
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}