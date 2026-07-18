"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Plus, Users, ArrowRight, Search } from "lucide-react";
import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import { MARATHON_STATUS_LABELS, MARATHON_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";

const BADGE_TONE = {
  [MARATHON_STATUS.ACTIVE]: "steppe",
  [MARATHON_STATUS.DRAFT]: "neutral",
  [MARATHON_STATUS.COMPLETED]: "horizon",
};

export default function TenantAdminHome({ params }) {
  const { orgId } = use(params);
  const { ready, tick } = useData();
  const [activeTab, setActiveTab] = useState("general"); // Табтарды басқару
  const [searchQuery, setSearchQuery] = useState(""); // Оқушыларды іздеу

  if (!ready) return <LoadingState />;

  const marathons = db.getMarathonsByOrg(orgId);
  
  // Ұйымдағы барлық марафондардың оқушыларын жинау
  const allStudents = marathons.flatMap(m => 
    db.getStudentsByMarathon(m.id).map(s => ({ ...s, marathonTitle: m.title }))
  );

  // Іздеу сұранысы бойынша сүзгілеу
  const filteredStudents = allStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Кабинет организатора</h1>
          <p className="text-mist text-sm mt-1">Управление марафонами и аналитика студентов.</p>
        </div>
        <Link href={`/org/${orgId}/admin/marathons/new`}>
          <Button>
            <Plus size={16} /> Создать марафон
          </Button>
        </Link>
      </div>

      {/* Ментор панеліндегідей Табтар (Вкладки) */}
      <div className="flex bg-paper-dim p-1 rounded-xl self-start">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "general" ? "bg-white text-ink shadow-sm" : "text-mist hover:text-ink"
          }`}
        >
          Общая статистика
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "students" ? "bg-white text-ink shadow-sm" : "text-mist hover:text-ink"
          }`}
        >
          Статистика студентов
        </button>
      </div>

      {/* 1-Таб: Общая статистика (Марафондар тізімі) */}
      {activeTab === "general" && (
        <>
          {marathons.length === 0 && (
            <Card className="text-center py-12">
              <p className="text-mist">Марафонов пока нет. Начните с создания первого.</p>
            </Card>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {marathons.map((marathon) => {
              const students = db.getStudentsByMarathon(marathon.id);
              const tasksCount = db.getTasksByMarathon(marathon.id).length;
              return (
                <Link key={marathon.id} href={`/org/${orgId}/admin/marathons/${marathon.id}`}>
                  <Card className="h-full flex flex-col gap-3 hover:border-horizon transition-colors">
                    <div className="flex items-start justify-between">
                      <h2 className="font-display font-semibold text-ink pr-2">{marathon.title}</h2>
                      <Badge tone={BADGE_TONE[marathon.status]}>
                        {MARATHON_STATUS_LABELS[marathon.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-mist line-clamp-2">{marathon.description}</p>
                    <div className="flex items-center gap-4 text-sm text-mist mt-auto pt-2 border-t border-mist-light">
                      <span className="flex items-center gap-1.5">
                        <Users size={14} /> Студентов: {students.length}
                      </span>
                      <span>Заданий: {tasksCount}/{marathon.durationDays}</span>
                    </div>
                    <p className="text-xs text-mist">Старт: {formatDate(marathon.startDate)}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-horizon-dark">
                      Управление <ArrowRight size={14} />
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* 2-Таб: Статистика студентов (Дәл ментордағыдай кесте) */}
      {activeTab === "students" && (
        <Card className="p-0 overflow-hidden flex flex-col gap-4">
          <div className="p-4 border-b border-mist-light flex items-center bg-paper-dim/40 gap-3">
            <Search size={18} className="text-mist shrink-0" />
            <input
              type="text"
              placeholder="Поиск студента по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-ink outline-none w-full"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-mist-light text-mist font-medium bg-paper-dim/20">
                  <th className="p-4">Студент</th>
                  <th className="p-4">Марафон</th>
                  <th className="p-4">Доводимость</th>
                  <th className="p-4">Действие</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-mist">
                      Студенты не найдены
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-mist-light hover:bg-paper-dim/20 last:border-0">
                      <td className="p-4 font-medium text-ink">{student.name}</td>
                      <td className="p-4 text-mist">{student.marathonTitle}</td>
                      <td className="p-4">
                        <span className="font-semibold text-horizon-dark">{student.progress || 0}%</span>
                      </td>
                      <td className="p-4">
                        <Link href={`/org/${orgId}/admin/marathons/${student.marathonId}`}>
                          <button className="text-xs font-medium text-horizon hover:text-horizon-dark flex items-center gap-1">
                            Перейти <ArrowRight size={12} />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}