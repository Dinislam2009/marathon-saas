"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  Save,
  CheckCircle,
  Sparkles,
  Lock,
  Camera,
  Loader2,
  Globe,
} from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

export default function CuratorProfileClient({ initialData }) {
  const { lang, changeLanguage } = useLanguage();
  const isRu = lang === "ru";

  const { curator, metrics } = initialData || {};

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [formData, setFormData] = useState({
    name: curator?.name || curator?.user?.name || (isRu ? "Куратор" : "Куратор"),
    email: curator?.email || curator?.user?.email || "",
    phone: curator?.phone || curator?.user?.phone || "",
    avatarUrl: curator?.avatarUrl || curator?.user?.image || "",
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(isRu ? "Размер изображения не должен превышать 5 МБ!" : "Сурет көлемі 5 МБ-тан аспауы тиіс!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!curator?.id || saving) return;

    setSaving(true);

    try {
      if (typeof actions.updatecuratorProfileAction === "function") {
        const res = await actions.updatecuratorProfileAction({
          curatorId: curator.id,
          name: formData.name,
          avatarUrl: formData.avatarUrl,
        });

        if (res?.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        } else {
          alert(isRu ? "Произошла ошибка при сохранении" : "Қате орын алды");
        }
      }
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 font-sans text-slate-900 pb-8">
      
      {/* БАННЕР */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs w-full">
        <div className="h-40 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 p-6 sm:p-8 flex justify-between items-start relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 inline-flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-300" />
              QADAM • {isRu ? "Статус: Куратор" : "Мәртебе: Куратор"}
            </span>
          </div>

          <span className="bg-emerald-500/20 backdrop-blur-md text-emerald-200 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {isRu ? "Активен" : "Белсенді"}
          </span>
        </div>

        {/* Аватар мен Метрикалар */}
        <div className="px-6 sm:px-8 pb-6 pt-0 flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="w-28 h-28 rounded-2xl bg-white p-2 shadow-lg relative shrink-0 group">
              <div className="w-full h-full rounded-xl overflow-hidden bg-purple-100 text-purple-700 flex items-center justify-center font-black text-3xl border border-purple-200 relative">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  formData.name[0]?.toUpperCase() || "К"
                )}

                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-[2px]">
                  <Camera size={20} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="mb-1 space-y-1">
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                {formData.name}
                <ShieldCheck size={22} className="text-purple-600" />
              </h1>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                <span>{formData.email || "—"}</span>
                <span>•</span>
                <span className="text-purple-700 font-bold">
                  {isRu ? "Куратор" : "Куратор"}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-semibold w-full md:w-auto">
            <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200/80 text-center">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                {isRu ? "Закреплено учеников" : "Бекітілген оқушылар"}
              </p>
              <p className="text-purple-700 font-black text-base mt-0.5">
                {metrics?.studentCount || 0} {isRu ? "учеников" : "оқушы"}
              </p>
            </div>
            <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200/80 text-center">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                {isRu ? "Проверено отчётов" : "Тексерілген есептер"}
              </p>
              <p className="text-emerald-600 font-black text-base mt-0.5">
                {metrics?.checkedSubmissionsCount || 0} {isRu ? "отчётов" : "есеп"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ПІШІН */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">
                {isRu ? "Личные данные куратора" : "Куратордың жеке деректері"}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {isRu ? "Личная информация профиля аккаунта" : "Аккаунт профилінің жеке ақпараты"}
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  Email <Lock size={12} className="text-slate-400" />
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-slate-100/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  {isRu ? "Номер телефона" : "Телефон нөмірі"} <Lock size={12} className="text-slate-400" />
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.phone || "—"}
                    readOnly
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-slate-100/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
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
              disabled={saving}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isRu ? "Сохранить изменения" : "Өзгерістерді сақтау"}
            </button>
          </div>
        </div>

        {/* ОҢ ЖАҚ БАҒАН */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl"><Globe size={20} /></div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isRu ? "Выбор языка интерфейса" : "Интерфейс тілін таңдау"}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => changeLanguage("kz")}
                className={`py-3 px-4 rounded-xl text-xs font-bold border cursor-pointer ${
                  lang === "kz" ? "bg-purple-600 text-white border-purple-600" : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                kz Қазақша
              </button>

              <button
                type="button"
                onClick={() => changeLanguage("ru")}
                className={`py-3 px-4 rounded-xl text-xs font-bold border cursor-pointer ${
                  lang === "ru" ? "bg-purple-600 text-white border-purple-600" : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                ru Русский
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl"><KeyRound size={20} /></div>
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