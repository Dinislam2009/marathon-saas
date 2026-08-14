"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { 
  User, Mail, Phone, ShieldCheck, KeyRound, Save, CheckCircle, Sparkles, 
  Globe, Loader2, Info, X, Lock
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

  // Модальды терезе күйлері
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passData, setPassData] = useState({ currentPassword: "", newPassword: "" });
  const [passSaving, setPassSaving] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
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

  // 2. ӨЗГЕРІСТЕРДІ БАЗАҒА САҚТАУ
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

  // 3. ПАРОЛЬДІ АУЫСТЫРУ
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (passSaving) return;

    if (passData.newPassword.length < 6) {
      setPassError(isRu ? "Пароль должен быть не менее 6 символов" : "Пароль кемінде 6 символдан тұруы керек");
      return;
    }

    setPassSaving(true);
    setPassError("");
    setPassSuccess(false);

    try {
      if (typeof actions.changeOrganizerPassword === "function") {
        const res = await actions.changeOrganizerPassword(orgId, passData);
        if (res?.ok) {
          setPassSuccess(true);
          setPassData({ currentPassword: "", newPassword: "" });
          setTimeout(() => {
            setPassSuccess(false);
            setIsPasswordModalOpen(false);
          }, 2000);
        } else {
          setPassError(res?.error || (isRu ? "Неверный текущий пароль" : "Қазіргі пароль қате"));
        }
      }
    } catch (err) {
      setPassError(err.message);
    } finally {
      setPassSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="w-full space-y-6 font-sans text-slate-900 pb-12 relative">
      {/* 1. БАННЕР МЕН ПРОФИЛЬ ДЕРЕКТЕРІ */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs w-full">
        <div className="h-32 sm:h-36 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 p-6 sm:p-8 flex justify-between items-start relative">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <span className="bg-white/10 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 inline-flex items-center gap-1.5 relative z-10">
            <Sparkles size={14} className="text-amber-300" />
            {isRu ? "Владелец платформы (Owner)" : "Платформа Иесі (Owner)"}
          </span>
        </div>

        <div className="px-6 sm:px-8 pb-6 pt-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 text-white p-1 shadow-xl border-4 border-white shrink-0 flex items-center justify-center font-black text-2xl sm:text-3xl">
              {formData.name?.charAt(0) || "O"}
            </div>

            <div className="sm:mb-1 space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                {formData.name || (isRu ? "Организатор" : "Ұйымдастырушы")}
                <ShieldCheck size={20} className="text-purple-600 shrink-0" />
              </h1>
              <p className="text-xs text-slate-500 font-medium">{formData.email || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ПРОФИЛЬ ПІШІНІ */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">
                {isRu ? "Данные организатора" : "Ұйымдастырушы деректері"}
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

        {/* Оң жақ баған */}
        <div className="space-y-6">
          {/* Тіл таңдау */}
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

          {/* Пароль қауіпсіздігі */}
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
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition flex items-center justify-between cursor-pointer"
            >
              <span>{isRu ? "Изменить пароль" : "Парольді өзгерту"}</span>
              <span className="text-purple-600 font-bold">→</span>
            </button>
          </div>
        </div>
      </form>

      {/* 3. ПАРОЛЬДІ ӨЗГЕРТУ МОДАЛЬДЫ ТЕРЕЗЕСІ (MODAL) */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  {isRu ? "Смена пароля" : "Парольді өзгерту"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isRu ? "Введите текущий и новый пароль" : "Ағымдағы және жаңа парольді енгізіңіз"}
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRu ? "Текущий пароль" : "Ағымдағы пароль"}
                </label>
                <input
                  type="password"
                  value={passData.currentPassword}
                  onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRu ? "Новый пароль" : "Жаңа пароль"}
                </label>
                <input
                  type="password"
                  value={passData.newPassword}
                  onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                  required
                />
              </div>

              {passError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <Info size={16} />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>{isRu ? "Пароль успешно изменен!" : "Пароль сәтті өзгертілді!"}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {isRu ? "Отмена" : "Бас тарту"}
                </button>
                <button
                  type="submit"
                  disabled={passSaving}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-200 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {passSaving && <Loader2 size={16} className="animate-spin" />}
                  {isRu ? "Обновить пароль" : "Парольді жаңарту"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}