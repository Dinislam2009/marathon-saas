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
  Folder 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function MaterialsClient({ initialMaterials = [] }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedIds, setSavedIds] = useState([]);

  const toggleSave = (id) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredMaterials = initialMaterials.filter((item) => {
    const matchesTab = activeTab === "all" || item.type === activeTab;
    const titleToSearch = isRu ? (item.titleRu || item.title) : (item.titleKz || item.title);
    const matchesSearch = (titleToSearch || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 w-full pb-8 font-sans text-slate-900">
      {/* 1. БӨЛІМ ШАПКАСЫ */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
            {isRu ? "Учебная база" : "Оқу базасы"}
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
            {isRu ? "Материалы и Ресурсы" : "Материалдар мен Ресурстар"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isRu
              ? "Конспекты уроков марафона, PDF-файлы и дополнительные материалы"
              : "Марафон сабақтарының конспектилері, PDF-файлдары және қосымша материалдары"}
          </p>
        </div>

        {/* ІЗДЕУ ЖӘНЕ ФИЛЬТР БАТЫРМАЛАРЫ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "all"
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-200"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {isRu ? `Все (${initialMaterials.length})` : `Барлығы (${initialMaterials.length})`}
            </button>
            <button
              onClick={() => setActiveTab("pdf")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "pdf"
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-200"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {isRu ? "PDF Документы" : "PDF Документтер"}
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "video"
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-200"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {isRu ? "Видеозаписи" : "Бейнежазбалар"}
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isRu ? "Поиск материала..." : "Материал іздеу..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 2. МАТЕРИАЛДАР СЕТКАСЫ */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <Folder className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-700">
            {isRu ? "Материалы не найдены" : "Материалдар табылмады"}
          </h3>
          <p className="text-xs text-gray-400">
            {isRu
              ? "Попробуйте изменить поисковый запрос или выбранную категорию"
              : "Іздеу сұранысын немесе таңдалған санатты өзгертіп көріңіз"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMaterials.map((item) => {
            const isSaved = savedIds.includes(item.id);
            const displayTitle = isRu ? (item.titleRu || item.title) : (item.titleKz || item.title);
            const displayCategory = isRu ? (item.categoryRu || item.category || "Материал") : (item.categoryKz || item.category || "Материал");

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2.5 rounded-2xl transition-transform group-hover:scale-105 ${
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
                          {displayCategory}
                        </span>
                        <span className="text-xs text-gray-400 block">{item.date || "2026"}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleSave(item.id)}
                      className={`transition-colors p-1 cursor-pointer ${
                        isSaved ? "text-purple-600 fill-purple-600" : "text-gray-300 hover:text-purple-600"
                      }`}
                      title={isSaved ? (isRu ? "Удалить из закладок" : "Бетбелгілерден алып тастау") : (isRu ? "Сохранить в закладки" : "Бетбелгілерге сақтау")}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-gray-800 leading-snug">
                    {displayTitle}
                  </h3>
                </div>

                {/* ТӨМЕНГІ БАР: ӨЛШЕМІ/ҰЗАҚТЫҒЫ ЖӘНЕ ЖҮКТЕУ БАТЫРМАСЫ */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs">
                  <span className="text-gray-400 font-medium">
                    {item.type === "video" ? item.duration || (isRu ? "Видео" : "Видео") : item.size || "PDF"}
                  </span>

                  {item.type === "video" ? (
                    <a
                      href={item.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 text-purple-700 font-bold rounded-xl hover:bg-purple-100 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {isRu ? "Смотреть" : "Көру"}
                    </a>
                  ) : (
                    <a
                      href={item.fileUrl || "#"}
                      download
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-purple-600 hover:text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isRu ? "Скачать" : "Жүктеу"}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}