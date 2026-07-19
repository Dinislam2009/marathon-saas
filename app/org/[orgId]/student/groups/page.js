"use client";

import { Users } from "lucide-react";
import * as actions from "@/app/actions";
import { useData } from "@/context/DataContext";
import Card from "@/components/ui/Card";
import LoadingState from "@/components/ui/LoadingState";

export default function GroupsPage() {
  const { ready, tick, currentStudentId } = useData();
  if (!ready || !currentStudentId) return <LoadingState />;

  const student = db.getStudent(currentStudentId);
  if (!student) return <LoadingState />;

  const teammates = db.getTeammates(currentStudentId);
  const marathon = db.getMarathonForStudent(currentStudentId);

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Users size={20} className="text-horizon-dark" />
        <h1 className="font-display text-2xl font-semibold text-ink">Моя группа</h1>
      </div>
      <p className="text-sm text-mist -mt-4">
        {teammates.length + 1} участников в марафоне «{marathon?.title}»
      </p>

      <div className="flex flex-col gap-3">
        <Card className="flex items-center justify-between !p-4 border-horizon/30 bg-horizon/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-horizon text-white flex items-center justify-center font-bold text-sm">
              {student.name[0]}
            </div>
            <div>
              <p className="text-sm font-bold text-ink">{student.name} <span className="text-xs text-mist font-normal">(ты)</span></p>
              <p className="text-xs text-mist">{student.points} баллов</p>
            </div>
          </div>
        </Card>

        {teammates.map((mate) => (
          <Card key={mate.id} className="flex items-center justify-between !p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-paper-dim text-ink flex items-center justify-center font-bold text-sm">
                {mate.name[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-ink">{mate.name}</p>
                <p className="text-xs text-mist">{mate.points} баллов</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
