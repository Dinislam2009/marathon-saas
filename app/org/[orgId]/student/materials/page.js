"use client";

import React, { useState } from "react";
import { 
  BookOpen, 
  Video, 
  FileText, 
  Download, 
  Search, 
  ExternalLink, 
  Bookmark, 
  Clock, 
  Folder 
} from "lucide-react";

export default function StudentMaterialsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Деректер мысалы
  const materials = [
    {
      id: 1,
      title: "1-Апта: Интенсив тест сұрақтары мен жауаптары",
      type: "pdf",
      category: "Тесттер",
      size: "2.4 MB",
      date: "20 Июль, 2026",
      downloads: 45,
    },
    {
      id: 2,
      title: "Математикалық сауаттылық: Барлық формулалар жинағы",
      type: "pdf",
      category: "Шпоры & Формулалар",
      size: "5.1 MB",
      date: "18 Июль, 2026",
      downloads: 128,
    },
    {
      id: 3,
      title: "Информатика: Python бастауыш алгоритмдері (Разбор)",
      type: "video",
      category: "Бейнесабақтар",
      duration: "35 мин",
      date: "15 Июль, 2026",
      link: "#",
    },
    {
      id: 4,
      title: "Уақытты тиімді басқару (Pomodoro техникасы)",
      type: "doc",
      category: "Гайдтар",
      size: "1.1 MB",
      date: "10 Июль, 2026",
      downloads: 62,
    },
  ];

  const filteredMaterials = materials.filter((item) => {
    const matchesTab = activeTab === "all" || item.type === activeTab;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 w-full">
      {/* 1. БӨЛІМ ШАПКАСЫ */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
            Оқу базасы
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
            Материалдар мен Ресурстар
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Марафон сабақтарының конспектілері, PDF-файлдары және қосымша материалдары
          </p>
        </div>

        {/* ІЗДЕУ ЖӘНЕ ФИЛЬТР БАТЫРМАЛАРЫ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Барлығы
            </button>
            <button
              onClick={() => setActiveTab("pdf")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === "pdf"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              PDF Документтер
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === "video"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Бейнежазбалар
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Материал іздеу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 2. МАТЕРИАЛДАР СЕТКАСЫ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMaterials.map((item) => (
          <div
            key={item.id}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2.5 rounded-2xl ${
                      item.type === "pdf"
                        ? "bg-red-50 text-red-600"
                        : item.type === "video"
                        ? "bg-purple-50 text-purple-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {item.type === "pdf" ? (
                      <FileText className="w-5 h-5" />
                    ) : item.type === "video" ? (
                      <Video className="w-5 h-5" />
                    ) : (
                      <BookOpen className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-400 block">{item.date}</span>
                  </div>
                </div>

                <button className="text-gray-300 hover:text-purple-600 transition-colors p-1">
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-sm font-bold text-gray-800 leading-snug">
                {item.title}
              </h3>
            </div>

            {/* ТӨМЕНГІ БАР: ӨЛШЕМІ/ҰЗАҚТЫҒЫ ЖӘНЕ ЖҮКТЕУ БАТЫРМАСЫ */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs">
              <span className="text-gray-400 font-medium">
                {item.type === "video" ? item.duration : item.size}
              </span>

              {item.type === "video" ? (
                <a
                  href={item.link}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 text-purple-700 font-bold rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Көру
                </a>
              ) : (
                <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-purple-600 hover:text-white transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Жүктеу
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}