"use client";

import React, { useState } from "react";
import { 
  Send, 
  Users, 
  Megaphone, 
  Smile, 
  Paperclip, 
  CheckCheck, 
  Search 
} from "lucide-react";

export default function StudentChatPage() {
  const [activeChat, setActiveChat] = useState("group"); // 'group' немесе 'marathon'
  const [messageText, setMessageText] = useState("");

  // Марафон чатындағы хабарламалар (Тек марафонға қатысты хабарландырулар)
  const [marathonMessages, setMarathonMessages] = useState([
    {
      id: 1,
      sender: "Сымбат (Куратор)",
      role: "Куратор",
      text: "Сәлем, оқушылар! Бүгінгі сабақтың материалдары мен PDF-файлдары 'Материалдар' бөліміне жүктелді. Барлығыңыз қарап шығыңыздар!",
      time: "10:30",
      isOfficial: true,
    },
    {
      id: 2,
      sender: "Сымбат (Куратор)",
      role: "Куратор",
      text: "Ескерту: Бүгінгі отчётты сағат 23:59-ға дейін тапсыруды ұмытпаңыздар! Стриктеріңізді жоғалтып алмаңыздар 🔥",
      time: "14:15",
      isOfficial: true,
    },
  ]);

  // Топ чатындағы хабарламалар ("Альфа" тобы)
  const [groupMessages, setGroupMessages] = useState([
    {
      id: 1,
      sender: "Айару Нұрланова",
      role: "Капитан",
      text: "Сәлем, Альфа тобы! Бүгінгі математикалық сауаттылық сұрақтарын кім аяқтады?",
      time: "11:20",
    },
    {
      id: 2,
      sender: "Данияр Беков",
      role: "Студент",
      text: "Мен 12-сұраққа келгенде сәл іркіліп қалдым, кім көмектесе алады?",
      time: "11:25",
    },
    {
      id: 3,
      sender: "Арафат (Сіз)",
      role: "Студент",
      text: "Данияр, 12-сұрақтың формуласын суретке түсіріп жіберейін бе? Сонымен шығару оңайырақ.",
      time: "11:28",
      isMe: true,
    },
    {
      id: 4,
      sender: "Данияр Беков",
      role: "Студент",
      text: "Иә, жіберші, рахмет!",
      time: "11:30",
    },
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "Арафат (Сіз)",
      role: "Студент",
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    if (activeChat === "group") {
      setGroupMessages([...groupMessages, newMsg]);
    } else {
      setMarathonMessages([...marathonMessages, newMsg]);
    }

    setMessageText("");
  };

  const currentMessages = activeChat === "group" ? groupMessages : marathonMessages;

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-2">
      {/* 1. СОЛ ЖАҚ: ЧАТТАР СЕКЦИЯСЫ (ТЕК 2 ЧАТ) */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-100 p-3 space-y-3 shrink-0">
        <div className="px-2 pt-1">
          <h2 className="text-lg font-extrabold text-gray-900">Чаттар</h2>
          <p className="text-xs text-gray-400">Байланыс пен талқылау орталығы</p>
        </div>

        <div className="space-y-2 pt-2">
          {/* ЧАТ 1: ТОП ЧАТЫ */}
          <button
            onClick={() => setActiveChat("group")}
            className={`w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left ${
              activeChat === "group"
                ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                activeChat === "group"
                  ? "bg-white/20 text-white"
                  : "bg-purple-100 text-purple-600"
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold truncate">"Альфа" Топ Чаты</h3>
                <span
                  className={`text-[10px] ${
                    activeChat === "group" ? "text-purple-200" : "text-gray-400"
                  }`}
                >
                  11:30
                </span>
              </div>
              <p
                className={`text-[11px] truncate mt-0.5 ${
                  activeChat === "group" ? "text-purple-100" : "text-gray-400"
                }`}
              >
                Данияр: Иә, жіберші, рахмет!
              </p>
            </div>
          </button>

          {/* ЧАТ 2: МАРАФОН ЧАТЫ */}
          <button
            onClick={() => setActiveChat("marathon")}
            className={`w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left ${
              activeChat === "marathon"
                ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                activeChat === "marathon"
                  ? "bg-white/20 text-white"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold truncate">Марафон Хабарландырулары</h3>
                <span
                  className={`text-[10px] ${
                    activeChat === "marathon" ? "text-purple-200" : "text-gray-400"
                  }`}
                >
                  14:15
                </span>
              </div>
              <p
                className={`text-[11px] truncate mt-0.5 ${
                  activeChat === "marathon" ? "text-purple-100" : "text-gray-400"
                }`}
              >
                Сымбат: Ескерту: Бүгінгі отчётты...
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 2. ОҢ ЖАҚ: ХАБАРЛАМАЛАР АЙМАҒЫ */}
      <div className="flex-1 flex flex-col justify-between h-full bg-gray-50/50 rounded-2xl md:rounded-r-2xl md:rounded-l-none border md:border-0 border-gray-100">
        {/* ЧАТ ШАПКАСЫ */}
        <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                activeChat === "group"
                  ? "bg-purple-100 text-purple-600"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              {activeChat === "group" ? (
                <Users className="w-5 h-5" />
              ) : (
                <Megaphone className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                {activeChat === "group"
                  ? '"Альфа" Топ Чаты'
                  : "Марафон Хабарландырулары & Ресми Чат"}
              </h3>
              <p className="text-[11px] text-gray-400">
                {activeChat === "group"
                  ? "12 Мүше • 5 Онлайн"
                  : "Тек куратор хабарландырулары мен марафон жаңалықтары"}
              </p>
            </div>
          </div>
        </div>

        {/* ХАБАРЛАМАЛАР ТІЗІМІ */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.isMe ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-gray-700">
                  {msg.sender}
                </span>
                <span className="text-[9px] text-gray-400">{msg.time}</span>
              </div>

              <div
                className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed ${
                  msg.isMe
                    ? "bg-purple-600 text-white rounded-tr-none shadow-sm shadow-purple-200"
                    : msg.isOfficial
                    ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none"
                    : "bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* ХАБАРЛАМА ЖІБЕРУ ФОРМАСЫ */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 rounded-b-2xl"
        >
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-purple-600 transition-colors rounded-xl hover:bg-gray-50"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder={
              activeChat === "group"
                ? "Топқа хабарлама жазу..."
                : "Сұрақ қою немесе жауап жазу..."
            }
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-purple-600 transition-colors"
          />

          <button
            type="submit"
            className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}