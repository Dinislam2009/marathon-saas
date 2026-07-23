"use client";

import { use, useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, ChevronDown, CircleCheck, Circle, Loader2 } from "lucide-react";
import * as actions from "@/app/actions";
import { useData } from "@/context/DataContext";
import { VERIFICATION_TYPE, VERIFICATION_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";

const EMPTY_TASK = { 
  title: "", 
  videoUrl: "", 
  content: "", 
  verificationType: VERIFICATION_TYPE.TEST 
};

export default function MarathonDetailPage({ params }) {
  const { orgId, marathonId } = use(params);
  const router = useRouter();
  
  const { ready, getMarathon } = useData();
  
  const [openDay, setOpenDay] = useState(null);
  const [draft, setDraft] = useState(EMPTY_TASK);
  const [dbTasks, setDbTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isPending, startTransition] = useTransition();

  // 1. Тапсырмаларды тікелей серверден (actions арқылы) жүктеп алу
  const fetchServerTasks = async () => {
    try {
      setIsLoadingTasks(true);
      // actions.js ішінде getTasksByMarathon болса немесе actions-тан сұрау:
      const tasksData = await actions.getTasksByMarathon(marathonId);
      if (Array.isArray(tasksData)) {
        setDbTasks(tasksData);
      }
    } catch (err) {
      console.error("Fetch tasks error:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchServerTasks();
  }, [marathonId]);

  if (!ready || isLoadingTasks) return <LoadingState />;

  const marathon = getMarathon ? getMarathon(marathonId) : null;
  if (!marathon) return <p className="p-6 text-mist">Марафон табылмады.</p>;

  // Context-ті емес, тікелей серверден келген dbTasks тізімін қолданамыз:
  const taskByDay = Object.fromEntries(dbTasks.map((t) => [t.dayNumber, t]));
  const days = Array.from({ length: marathon.durationDays || 21 }, (_, i) => i + 1);

  function openEditor(day) {
    setOpenDay(openDay === day ? null : day);
    setDraft(taskByDay[day] || EMPTY_TASK);
  }

  function handleSave(day) {
    if (!draft.title || !draft.title.trim()) {
      alert("Өтініш, тапсырма атауын енгізіңіз!");
      return;
    }

    startTransition(async () => {
      try {
        const res = await actions.upsertTask(marathonId, day, draft);

        if (res) {
          // Базаға сақталған бойда серверден жаңа тізімді қайта тартып аламыз:
          await fetchServerTasks();
          setOpenDay(null);
        }
      } catch (error) {
        console.error("Save error:", error);
        alert("Тапсырманы сақтау кезінде қате шықты: " + (error.message || "Сервер қатесі"));
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/org/${orgId}/admin`}
          className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-ink w-fit mb-3"
        >
          <ArrowLeft size={14} /> Марафондарым
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{marathon.title}</h1>
            <p className="text-mist text-sm mt-1">
              {dbTasks.length}/{marathon.durationDays} күн дайын
            </p>
          </div>
          <Link href={`/org/${orgId}/admin/marathons/${marathonId}/students`}>
            <Button variant="secondary">
              <Users size={16} /> Оқушылар
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {days.map((day) => {
          const task = taskByDay[day];
          const isOpen = openDay === day;
          return (
            <Card key={day} padded={false} className="overflow-hidden">
              <button
                type="button"
                onClick={() => openEditor(day)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-paper-dim transition-colors cursor-pointer"
              >
                {task ? (
                  <CircleCheck size={18} className="text-steppe shrink-0" />
                ) : (
                  <Circle size={18} className="text-mist-light shrink-0" />
                )}
                <span className="text-xs font-medium text-mist w-14 shrink-0">{day}-күн</span>
                <span className={cn("flex-1 text-sm truncate", task ? "text-ink" : "text-mist italic")}>
                  {task ? task.title : "Тапсырма қосылмаған"}
                </span>
                <ChevronDown
                  size={16}
                  className={cn("text-mist transition-transform shrink-0", isOpen && "rotate-180")}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-mist-light pt-4 flex flex-col gap-3">
                  <input
                    autoFocus
                    placeholder="Тапсырма атауы"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="rounded-xl border border-mist-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    placeholder="Видео сілтемесі (YouTube, Google Drive...)"
                    value={draft.videoUrl || ""}
                    onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
                    className="rounded-xl border border-mist-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <textarea
                    rows={3}
                    placeholder="Тапсырма мәтіні"
                    value={draft.content || ""}
                    onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                    className="rounded-xl border border-mist-light px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div>
                    <p className="text-xs font-medium text-mist mb-2">Тексеру форматы</p>
                    <div className="flex gap-2">
                      {Object.values(VERIFICATION_TYPE).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setDraft({ ...draft, verificationType: type })}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer",
                            draft.verificationType === type
                              ? "bg-horizon text-white border-horizon"
                              : "border-mist-light text-mist hover:border-mist"
                          )}
                        >
                          {VERIFICATION_TYPE_LABELS[type]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-mist mb-2">Файл жүктеу (үлгі)</p>
                    <div className="rounded-xl border border-dashed border-mist-light px-3 py-4 text-center text-xs text-mist">
                      Phase 2: Firebase Storage / S3 қосылғанда іске қосылады
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setOpenDay(null)}
                      disabled={isPending}
                    >
                      Бас тарту
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleSave(day)}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 size={14} className="animate-spin" /> : "Сақтау"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}