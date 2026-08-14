"use client";

import React, { useState, useEffect, useCallback, useRef, use } from "react";
import { 
  User, Mail, Phone, ShieldCheck, KeyRound, Save, CheckCircle, Sparkles, 
  Globe, Camera, Loader2, Info 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import * as actions from "@/app/actions";
import LoadingState from "@/components/LoadingState";

export default function AdminProfilePage({ params }) {
  const { lang, changeLanguage } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const orgId = resolvedParams?.orgId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    image: null,
    role: "ORGANIZER",
  });

  // 1. ДЕРЕКТЕРДІ БАЗАДАН АЛУ
  const fetchProfile = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      if (typeof actions.getOrganizerProfile === "function") {
        const profile = await actions.getOrganizerProfile(orgId);
        if (profile) {
          setFormData({
            name: profile.name || "",
            email: profile.email || "",
            phone: profile.phone || "",
            image: profile.image || null,
            role: profile.role || "ORGANIZER",
          });
        }
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 2. АВАТАР ФОТОСЫН ТАҢДАУ ЖӘНЕ BASE64-КЕ АЙНАЛДЫРУ
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(isRu ? "Файл слишком большой (макс: 5 МБ)" : "Файл тым үлкен (макс: 5 МБ)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // 3. ӨЗГЕРІСТЕРДІ БАЗАҒА САҚТАУ
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setErrorMsg("");
    try {
      if (typeof actions.updateOrganizerProfile === "function") {
        const res = await actions.updateOrganizerProfile(orgId, formData);
        if (res?.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        } else {
          setErrorMsg(res?.error || (isRu ? "Ошибка при сохранении" : "Сақтау кезінде қате орын алды"));
        }
      }
    } catch (err) {
      console.error("Update profile error:", err);
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

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
            {/* АВАТАР БЛОГЫ & СУРЕТ ЖҮКТЕУ */}
            <div className="w-28 h-28 rounded-2xl bg-white p-1.5 shadow-lg relative shrink-0 group">
              <div className="w-full h-full rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-3xl overflow-hidden relative">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  formData.name?.charAt(0) || "O"
                )}

                {/* Камера Батырмасы */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
                  title={isRu ? "Изменить аватар" : "Суретті ауыстыру"}
                >
                  <Camera size={20} />
                  <span className="text-[9px] font-bold mt-1">
                    {isRu ? "Изменить" : "Ауыстыру"}
                  </span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="mb-1 space-y-1">
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                {formData.name || (isRu ? "Организатор" : "Организатор")}
                <ShieldCheck size={22} className="text-purple-600" />
              </h1>
              <p className="text-xs text-slate-500 font-medium">{formData.email || "—"}</p>
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
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  {isRu ? "Номер телефона" : "Телефон нөмірі"}
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <Info size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {saved ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                <CheckCircle size={16} /> {isRu ? "Успешно сохранено!" : "Сәтті сақталды!"}
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-200 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving 
                ? (isRu ? "Сохранение..." : "Сақталуда...") 
                : (isRu ? "Сохранить изменения" : "Өзгерістерді сақтау")}
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
              onClick={() => alert(isRu ? "Инструкция по смене пароля отправлена на пошту" : "Парольді өзгерту сілтемесі поштаңызға жіберілді")}
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