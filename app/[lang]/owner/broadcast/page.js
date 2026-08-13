"use client";

import React, { useState } from "react";
import { Send, Megaphone, CheckCircle2, Loader2 } from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

export default function OwnerBroadcastPage() {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const broadcastFn =
        actions.createGlobalBroadcastAction || actions.createGlobalBroadcast;

      let res = null;
      if (typeof broadcastFn === "function") {
        res = await broadcastFn({
          title,
          message,
          targetRole,
        });
      }

      if (res?.ok) {
        setSuccess(true);
        setTitle("");
        setMessage("");
        setTimeout(() => setSuccess(false), 4000);
      } else {
        alert(
          (isRu ? "Ошибка: " : "Қате: ") +
            (res?.error || (isRu ? "Неизвестная ошибка" : "Белгісіз қате"))
        );
      }
    } catch (err) {
      console.error("Broadcast send error:", err);
      alert(
        isRu
          ? "Произошла ошибка при отправке."
          : "Жіберу кезінде қате орын алды."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12 font-sans text-slate-900">
      {/* HEADER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
            <Megaphone size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isRu ? "Глобальные объявления" : "Глобалды Хабарландырулар"}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {isRu
                ? "Отправка системных сообщений всем B2B клиентам, кураторам или ученикам платформы."
                : "Платформадағы барлық B2B клиенттерге, кураторларға немесе оқушыларға жүйелік хабарлама жіберу."}
            </p>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-3xl">
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={18} />
            {isRu
              ? "Объявление успешно отправлено! Оно появится в кабинетах пользователей."
              : "Хабарландыру сәтті жіберілді! Барлық пайдаланушылардың кабинетінде көрінеді."}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-5">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
              {isRu ? "Аудитория (Получатели)" : "Аудитория (Кімдерге жіберіледі)"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "ALL", label: isRu ? "Всем" : "Барлығына" },
                { id: "ORGANIZER", label: isRu ? "Организациям (B2B)" : "Ұйымдарға (B2B)" },
                { id: "MENTOR", label: isRu ? "Кураторам" : "Кураторларға" },
                { id: "STUDENT", label: isRu ? "Ученикам" : "Оқушыларға" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setTargetRole(item.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                    targetRole === item.id
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
              {isRu ? "Заголовок объявления" : "Хабарландыру Тақырыбы"}
            </label>
            <input
              type="text"
              required
              placeholder={
                isRu
                  ? "Например: Технические работы или Новое обновление!"
                  : "Мысалы: Техникалық жұмыстар немесе Жаңа жаңарту!"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 transition"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
              {isRu ? "Текст сообщения" : "Хабарлама Мәтіні"}
            </label>
            <textarea
              rows={5}
              required
              placeholder={
                isRu
                  ? "Напишите подробную информацию..."
                  : "Толық мәліметті жазыңыз..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-purple-600 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
            {isRu ? "Опубликовать объявление" : "Хабарландыруды Жариялау"}
          </button>
        </form>
      </div>
    </div>
  );
}