"use client";

import { useState } from "react";
import { LayoutGrid, Plus, X } from "lucide-react";
import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import { MATRIX_QUADRANTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";

const TONE_BG = {
  ember: "bg-ember-light border-ember/20",
  steppe: "bg-steppe-light border-steppe/20",
  horizon: "bg-horizon/10 border-horizon/20",
  neutral: "bg-paper-dim border-mist-light",
};

export default function MatrixPage() {
  const { ready, tick, currentStudentId, addMatrixTask, toggleMatrixTaskDone, deleteMatrixTask } = useData();
  const [form, setForm] = useState(null); // holds { urgent, important } while the add-form is open

  if (!ready || !currentStudentId) return <LoadingState />;

  const tasks = db.getMatrixTasksByStudent(currentStudentId);

  function handleAdd(e, urgent, important) {
    e.preventDefault();
    const title = new FormData(e.target).get("title")?.toString().trim();
    if (!title) return;
    addMatrixTask(currentStudentId, { title, urgent, important });
    e.target.reset();
    setForm(null);
  }

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <LayoutGrid size={20} className="text-horizon-dark" />
        <h1 className="font-display text-2xl font-semibold text-ink">Эйзенхауэр матрицасы</h1>
      </div>
      <p className="text-sm text-mist -mt-4">Тапсырмаларыңды маңыздылығы мен шұғылдығына қарай бөл</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MATRIX_QUADRANTS.map((q) => {
          const items = tasks.filter((t) => t.urgent === q.urgent && t.important === q.important);
          const formOpen = form?.urgent === q.urgent && form?.important === q.important;
          return (
            <div key={q.key} className={cn("rounded-2xl border p-4 flex flex-col gap-2 min-h-[160px]", TONE_BG[q.tone])}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-ink">{q.label}</p>
                <button
                  onClick={() => setForm(formOpen ? null : { urgent: q.urgent, important: q.important })}
                  className="text-mist hover:text-horizon-dark"
                >
                  <Plus size={16} />
                </button>
              </div>

              {formOpen && (
                <form onSubmit={(e) => handleAdd(e, q.urgent, q.important)} className="flex gap-1.5 mb-1">
                  <input
                    name="title"
                    autoFocus
                    placeholder="Тапсырма..."
                    className="flex-1 rounded-lg border border-mist-light px-2.5 py-1.5 text-xs bg-white"
                  />
                  <button type="submit" className="text-horizon-dark text-xs font-bold px-2">Қосу</button>
                </form>
              )}

              {items.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-white/70 rounded-lg px-2.5 py-1.5">
                  <button
                    onClick={() => toggleMatrixTaskDone(t.id)}
                    className={cn("text-xs text-left flex-1", t.done && "line-through text-mist")}
                  >
                    {t.title}
                  </button>
                  <button onClick={() => deleteMatrixTask(t.id)} className="text-mist hover:text-ember">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
