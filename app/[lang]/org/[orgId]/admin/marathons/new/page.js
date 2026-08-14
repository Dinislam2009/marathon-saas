"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { createMarathon } from "@/app/actions";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function NewMarathonPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const orgId = resolvedParams?.orgId;

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationDays: 21,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || loading) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await createMarathon({ orgId, ...form });
      if (res?.ok) {
        // Марафон құрылған соң админкаға редирект жасаймыз
        router.push(`/${lang}/org/${orgId}/admin`);
      } else {
        setErrorMessage(
          res?.error || (isRu ? "Не удалось создать марафон" : "Марафонды құру мүмкін болмады")
        );
      }
    } catch (err) {
      console.error("Create marathon error:", err);
      setErrorMessage(isRu ? "Ошибка сервера" : "Серверлік қате орын алды");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12 font-sans text-slate-900">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link
          href={orgId ? `/${lang}/org/${orgId}/admin` : `/${lang}/org/admin`}
          className="p-2.5 bg-white rounded-2xl border border-slate-200/80 text-slate-600 hover:bg-slate-50 transition shadow-xs cursor-pointer"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {isRu ? "Создание нового марафона" : "Жаңа Марафон Құру"}
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {isRu ? "Заполните данные для запуска" : "Іске қосу үшін мәліметтерді толтырыңыз"}
          </p>
        </div>
      </div>

      {/* 🔔 СӘНДІ ҚАТЕ ПАНЕЛІ (ALERT BOX) */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs font-bold text-rose-700 leading-relaxed">
            {errorMessage}
          </div>
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
            {isRu ? "Название марафона *" : "Марафон Атауы *"}
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={isRu ? "Например: 21-дневный интенсив QADAM" : "Мысалы: QADAM 21-күндік интенсив"}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
            {isRu ? "Описание" : "Сипаттамасы"}
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={isRu ? "Краткая информация о марафоне..." : "Марафон туралы қысқаша ақпарат..."}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
            {isRu ? "Длительность (дней)" : "Ұзақтығы (күн)"}
          </label>
          <input
            type="number"
            value={form.durationDays}
            onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl shadow-md shadow-purple-200 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading
            ? (isRu ? "Создание..." : "Құрылуда...")
            : (isRu ? "Создать марафон" : "Марафонды Құру")}
        </button>
      </form>
    </div>
  );
}