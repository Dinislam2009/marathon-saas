"use client";

import React, { useState } from "react";
import { Search, Users, Award, GraduationCap, Loader2 } from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

export default function StudentsClient({ initialStudents = [], groups = [] }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [students, setStudents] = useState(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const handleGroupChange = async (studentId, newGroupId) => {
    setUpdatingId(studentId);
    try {
      if (typeof actions.assignStudentToGroupAction === "function") {
        const res = await actions.assignStudentToGroupAction(studentId, newGroupId);
        if (res?.ok) {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId
                ? {
                    ...s,
                    groupId: newGroupId,
                    groupName:
                      groups.find((g) => g.id === newGroupId)?.name ||
                      (isRu ? "Без группы" : "Топсыз"),
                  }
                : s
            )
          );
        } else {
          alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || ""));
        }
      }
    } catch (err) {
      console.error("Change group error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full pb-8 font-sans text-slate-900">
      {/* 1. ШАПКА ЖӘНЕ ИНФО-КАРТОЧКАЛАР */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {isRu ? "Все участники" : "Барлық Қатысушылар"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {isRu
                ? "Участники и группы всех марафонов организации в одном месте."
                : "Ұйымның барлық марафондарының қатысушылары мен топтары бір жерде."}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isRu ? "Поиск участника..." : "Қатысушыны іздеу..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-purple-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center gap-3">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-purple-600 font-bold uppercase">
                {isRu ? "Всего участников" : "Барлық Қатысушы"}
              </div>
              <div className="text-xl font-extrabold text-purple-900">{students.length}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-amber-700 font-bold uppercase">
                {isRu ? "Общий балл" : "Жалпы Балл"}
              </div>
              <div className="text-xl font-extrabold text-amber-900">
                {students.reduce((acc, s) => acc + (s.points || 0), 0)}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-blue-600 font-bold uppercase">
                {isRu ? "Средний балл" : "Орташа Балл"}
              </div>
              <div className="text-xl font-extrabold text-blue-900">
                {students.length > 0
                  ? Math.round(students.reduce((acc, s) => acc + (s.points || 0), 0) / students.length)
                  : 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ОҚУШЫЛАР КЕСТЕСІ */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-4 pl-6">{isRu ? "ФИО" : "Аты-Жөні"}</th>
                <th className="p-4">{isRu ? "Email / Телефон" : "Email / Телефон"}</th>
                <th className="p-4">{isRu ? "Марафон" : "Марафон"}</th>
                <th className="p-4">{isRu ? "Привязать к группе" : "Топқа Бекіту"}</th>
                <th className="p-4 pr-6 text-right">{isRu ? "Баллы" : "Баллдар"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    {isRu ? "Ученики не найдены" : "Оқушылар табылмады"}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const availableGroups = groups.filter((g) => g.marathonId === student.marathonId);

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-gray-900">{student.name}</td>
                      <td className="p-4">
                        <div className="text-gray-800">{student.email || "—"}</div>
                        <div className="text-[10px] text-gray-400">{student.phone || "—"}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold">
                          {student.marathonTitle || (isRu ? "Без марафона" : "Марафонсыз")}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={student.groupId || ""}
                            disabled={updatingId === student.id}
                            onChange={(e) => handleGroupChange(student.id, e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 outline-none focus:border-purple-600 font-semibold text-gray-800 cursor-pointer"
                          >
                            <option value="">{isRu ? "— Без группы —" : "— Топсыз —"}</option>
                            {availableGroups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                          {updatingId === student.id && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                          )}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right font-extrabold text-purple-700">
                        {student.points || 0} {isRu ? "б" : "б"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}