"use client";

import { Crown } from "lucide-react";
import * as actions from "@/app/actions";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";

const RANK_COLOR = ["text-horizon-dark", "text-mist", "text-ember"];

export default function LeaderboardPage() {
  const { ready, tick, currentStudentId } = useData();

  if (!ready || !currentStudentId) return null;

  const student = db.getStudent(currentStudentId);
  if (!student) return null;

  const leaderboard = db.getLeaderboard(student.marathonId);

  return (
    <div key={tick} className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Рейтинг</h1>
        <p className="text-mist text-sm mt-1">Марафон бойынша ұпайлар рейтингі</p>
      </div>

      <Card padded={false} className="overflow-hidden">
        {leaderboard.map((s, idx) => {
          const isMe = s.id === student.id;
          return (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 border-b border-mist-light last:border-0",
                isMe && "bg-horizon/5"
              )}
            >
              <div className="w-6 flex justify-center shrink-0">
                {idx < 3 ? (
                  <Crown size={18} className={RANK_COLOR[idx]} />
                ) : (
                  <span className="text-sm text-mist font-medium">{idx + 1}</span>
                )}
              </div>
              <span className={cn("flex-1 text-sm truncate", isMe ? "font-semibold text-horizon-dark" : "text-ink")}>
                {s.name} {isMe && <span className="text-xs text-mist font-normal">(сен)</span>}
              </span>
              <span className="text-sm font-semibold text-ink">{s.points} ұпай</span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
