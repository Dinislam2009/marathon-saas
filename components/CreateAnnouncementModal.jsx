"use client";

import React, { useState } from "react";
import { Megaphone, Send, Loader2, X, CheckCircle2 } from "lucide-react";
import { createAnnouncement } from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

export default function CreateAnnouncementModal({
  isOpen,
  onClose,
  marathonId,
  groups = [],
  authorRole = "ORGANIZER",
  authorName = "Ұйымдастырушы",
  onSuccess,
}) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await createAnnouncement({
        title,
        content,
        authorRole,
        authorName,
        marathonId,
        groupId: selectedGroupId || null,
      });

      if (res?.ok) {
        setTitle("");
        setContent("");
        setSelectedGroupId("");
        setSuccessMsg(true);

        if (onSuccess) onSuccess();

        setTimeout(() => {
          setSuccessMsg(false);
          onClose();
        }, 1200);
      } else {
        alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || (isRu ? "Неизвестная ошибка" : "Белгісіз қате")));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 relative">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-purple-700 font-extrabold">
            <Megaphone size={20} />
            <h2 className="text-lg text-slate-900 font-black">
              {isRu ? "Новое объявление" : "Жаңа Хабарландыру"}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            type="button"
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
            <h3 className="text-base font-extrabold text-slate-900">
              {isRu ? "Объявление опубликовано!" : "Хабарландыру жарияланды!"}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {isRu ? "Успешно отправлено в кабинет учеников" : "Оқушылар кабинетіне сәтті жіберілді"}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRu ? "Кому адресовано?" : "Кімге бағытталған?"}
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-600 transition-all"
              >
                <option value="">
                  {isRu ? "📢 Всем ученикам (Марафон)" : "📢 Барлық оқушыларға (Марафон)"}
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {isRu ? `👥 Только группе "${g.name}"` : `👥 Тек "${g.name}" тобына`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRu ? "Тема" : "Тақырыбы"}
              </label>
              <input
                type="text"
                placeholder={isRu ? "Например: Время завтрашнего вебинара изменено!" : "Мысалы: Ертеңгі вебинар уақыты ауысты!"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRu ? "Текст объявления" : "Хабарландыру мәтіні"}
              </label>
              <textarea
                rows={4}
                placeholder={isRu ? "Напишите подробную информацию здесь..." : "Толық ақпаратты осы жерге жазыңыз..."}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-600 resize-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isRu ? "Опубликовать" : "Жариялау"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}