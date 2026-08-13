"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { createMarathonAction } from "@/app/actions";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function NewMarathonPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const orgId = resolvedParams?.orgId;

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationDays: 21,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || loading) return;

    setLoading(true);
    try {
      const res = await createMarathonAction({ orgId, ...form });
      if (res?.ok) {
        router.push(`/${lang}/org/admin`);
      } else {
        alert(
          (isRu ? "Ошибка: " : "Қате: ") +
            (res?.error || (isRu ? "Не удалось создать марафон" : "Марафонды құру мүмкін болмады"))
        );
      }
    } catch (err) {
      console.error("Create marathon error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12 font-sans text-slate-900">
      <div className="flex items-center gap-3">
        <Link
          href={`/${lang}/org/admin`}
          className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-black text-gray-900">
          {isRu ? "Создание нового марафона" : "Жаңа Марафон Құру"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            {isRu ? "Название марафона *" : "Марафон Атауы *"}
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={isRu ? "Например: 21-дневный интенсив QADAM" : "Мысалы: QADAM 21-күндік интенсив"}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            {isRu ? "Описание" : "Сипаттамасы"}
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={isRu ? "Краткая информация о марафоне..." : "Марафон туралы қысқаша ақпарат..."}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            {isRu ? "Длительность (дней)" : "Ұзақтығы (күн)"}
          </label>
          <input
            type="number"
            value={form.durationDays}
            onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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