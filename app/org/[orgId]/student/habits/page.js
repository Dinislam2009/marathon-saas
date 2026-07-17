"use client";

import { useState } from "react";
import { Target, Plus, Check, Trash2 } from "lucide-react";
import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function HabitsPage() {
  const { ready, tick, currentStudentId, addHabit, toggleHabitToday, deleteHabit } = useData();
  const [title, setTitle] = useState("");

  if (!ready || !currentStudentId) return <LoadingState />;

  const habits = db.getHabitsByStudent(currentStudentId);

  function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    addHabit(currentStudentId, title.trim());
    setTitle("");
  }

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Target size={20} className="text-horizon-dark" />
        <h1 className="font-display text-2xl font-semibold text-ink">Әдеттер</h1>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Жаңа әдет қосу (мыс. Су ішу)"
          className="flex-1 rounded-xl border border-mist-light px-3.5 py-2.5 text-sm"
        />
        <Button type="submit" size="default">
          <Plus size={16} />
        </Button>
      </form>

      {habits.length === 0 && (
        <Card className="text-center py-10 text-mist text-sm">Әлі әдет қосылмаған.</Card>
      )}

      <div className="flex flex-col gap-3">
        {habits.map((habit) => {
          const done = habit.doneDates.includes(todayKey());
          return (
            <Card key={habit.id} className="flex items-center justify-between !p-4">
              <div>
                <p className="text-sm font-bold text-ink">{habit.title}</p>
                <p className="text-xs text-mist mt-0.5">{habit.doneDates.length} рет орындалды</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleHabitToday(habit.id)}
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center border transition-colors",
                    done ? "bg-steppe text-white border-steppe" : "border-mist-light text-mist hover:border-horizon"
                  )}
                >
                  <Check size={16} strokeWidth={3} />
                </button>
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="h-9 w-9 rounded-full flex items-center justify-center text-mist hover:text-ember hover:bg-ember-light"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
