"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import Card from "@/components/ui/Card";
import LoadingState from "@/components/ui/LoadingState";

export default function MaterialsPage() {
  const { ready, tick, currentStudentId } = useData();
  if (!ready || !currentStudentId) return <LoadingState />;

  const materials = db.getMaterialsForStudent(currentStudentId);

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <BookOpen size={20} className="text-horizon-dark" />
        <h1 className="font-display text-2xl font-semibold text-ink">Материалдар</h1>
      </div>
      <p className="text-sm text-mist -mt-4">Марафон бойынша барлық бейнесабақ пен тапсырма мәтіні</p>

      {materials.length === 0 && (
        <Card className="text-center py-10 text-mist text-sm">Әзірге материал қосылмаған.</Card>
      )}

      <div className="flex flex-col gap-3">
        {materials.map((task) => (
          <Card key={task.id} className="!p-4">
            <p className="text-xs font-bold text-horizon-dark mb-1">{task.dayNumber}-күн</p>
            <p className="text-sm font-bold text-ink mb-1">{task.title}</p>
            {task.content && <p className="text-sm text-mist mb-2">{task.content}</p>}
            {task.videoUrl && (
              <a
                href={task.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-horizon-dark font-medium"
              >
                Бейнесабақты ашу <ExternalLink size={12} />
              </a>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
