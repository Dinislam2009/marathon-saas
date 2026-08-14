"use client";

import { use, useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, ChevronDown, CircleCheck, Circle, Loader2, Paperclip, X, Upload, AlertCircle } from "lucide-react";
import * as actions from "@/app/actions";
import { useData } from "@/context/DataContext";
import { VERIFICATION_TYPE, VERIFICATION_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Card from "@/components/Card";
import Button from "@/components/Button";
import LoadingState from "@/components/LoadingState";
import { supabase } from "@/lib/supabase";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILES_COUNT = 3;

const EMPTY_TASK = { 
  title: "", 
  videoUrl: "", 
  content: "", 
  fileUrls: [], 
  verificationType: VERIFICATION_TYPE.TEST 
};

export default function MarathonDetailPage({ params }) {
  const resolvedParams = use(params);
  const marathonId = resolvedParams?.marathonId;
  const router = useRouter();
  
  const { ready, getMarathon } = useData();
  
  const [openDay, setOpenDay] = useState(null);
  const [draft, setDraft] = useState(EMPTY_TASK);
  const [dbTasks, setDbTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchServerTasks = async () => {
    if (!marathonId) return;
    try {
      setIsLoadingTasks(true);
      if (typeof actions.getTasksByMarathon === "function") {
        const tasksData = await actions.getTasksByMarathon(marathonId);
        if (Array.isArray(tasksData)) {
          setDbTasks(tasksData);
        }
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

  const taskByDay = Object.fromEntries(dbTasks.map((t) => [t.dayNumber, t]));
  const days = Array.from({ length: marathon.durationDays || 21 }, (_, i) => i + 1);

  function openEditor(day) {
    setOpenDay(openDay === day ? null : day);
    setUploadError("");
    const existingTask = taskByDay[day];
    setDraft(existingTask ? {
      ...existingTask,
      fileUrls: existingTask.fileUrls || (existingTask.fileUrl ? [existingTask.fileUrl] : [])
    } : EMPTY_TASK);
  }

  const handleRemoveFile = (indexToRemove) => {
    setDraft((prev) => ({
      ...prev,
      fileUrls: (prev.fileUrls || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSave = async (day) => {
    if (!draft.title.trim()) {
      setUploadError("Тапсырма атауын енгізіңіз!");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          ...draft,
          marathonId,
          dayNumber: day,
        };

        if (typeof actions.createOrUpdateTask === "function") {
          await actions.createOrUpdateTask(payload);
        }

        await fetchServerTasks();
        setOpenDay(null);
      } catch (err) {
        console.error("Save task error:", err);
        setUploadError("Тапсырманы сақтау кезінде қателік орын алды: " + (err.message || "Белгісіз қате"));
      }
    });
  };

  const handleFileUpload = async (e) => {
    setUploadError("");
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentFiles = draft.fileUrls || [];

    if (currentFiles.length + files.length > MAX_FILES_COUNT) {
      setUploadError(`Бір тапсырмаға максимум ${MAX_FILES_COUNT} файл тіркеуге болады!`);
      e.target.value = "";
      return;
    }

    setIsUploadingFile(true);

    try {
      const newUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          setUploadError(`"${file.name}" файлы өте үлкен! Өлшемі ${MAX_FILE_SIZE_MB} МБ-тан аспауы керек.`);
          continue;
        }

        const safeOriginalName = file.name
          .replace(/[^a-zA-Z0-9.-]/g, "_")
          .toLowerCase();

        const fileName = `tasks/m_${marathonId}_day_${openDay}_${Date.now()}_${safeOriginalName}`;

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabase?.storage) {
          const { error } = await supabase.storage
            .from("submissions")
            .upload(fileName, file, { upsert: true });

          if (error) throw error;

          const { data: publicUrlData } = supabase.storage
            .from("submissions")
            .getPublicUrl(fileName);

          newUrls.push(publicUrlData.publicUrl);
        } else {
          const uploadResponse = await fetch(
            `${supabaseUrl}/storage/v1/object/submissions/${fileName}`,
            {
              method: "POST",
              headers: {
                "apikey": anonKey,
                "Authorization": `Bearer ${anonKey}`,
                "x-upsert": "true",
              },
              body: file,
            }
          );

          const resData = await uploadResponse.json().catch(() => ({}));

          if (!uploadResponse.ok) {
            throw new Error(resData.error || resData.message || resData.statusCode || "Файлды жүктеу сәтсіз аяқталды");
          }

          const publicUrl = `${supabaseUrl}/storage/v1/object/public/submissions/${fileName}`;
          newUrls.push(publicUrl);
        }
      }

      setDraft((prev) => ({
        ...prev,
        fileUrls: [...(prev.fileUrls || []), ...newUrls],
      }));
    } catch (err) {
      console.error("Upload Error:", err);
      setUploadError("Файлды жүктеу қателігі: " + (err.message || "Белгісіз қате"));
    } finally {
      setIsUploadingFile(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/org/admin`}
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
          <Link href={`/org/admin/marathons/${marathonId}/students`}>
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
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-medium text-mist">Материал/Файл тіркеу</p>
                      <span className="text-[10px] text-mist font-normal">
                        ({(draft.fileUrls || []).length}/{MAX_FILES_COUNT})
                      </span>
                    </div>

                    {uploadError && (
                      <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center justify-between animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={15} className="shrink-0 text-red-500" />
                          <span>{uploadError}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setUploadError("")}
                          className="p-1 hover:bg-red-100 rounded-lg transition-colors text-red-500 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {(draft.fileUrls || []).length > 0 && (
                      <div className="flex flex-col gap-2 mb-2">
                        {draft.fileUrls.map((url, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-xl border border-mist-light p-2.5 bg-paper-dim">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-xs text-horizon font-medium hover:underline truncate max-w-[85%]"
                            >
                              <Paperclip size={14} className="shrink-0" />
                              <span className="truncate">Файл #{idx + 1} ашу</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="p-1 hover:bg-mist-light/50 rounded-lg text-mist hover:text-ink transition-colors cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {(draft.fileUrls || []).length < MAX_FILES_COUNT && (
                      <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-mist-light p-4 hover:border-horizon hover:bg-paper-dim transition-all cursor-pointer">
                        {isUploadingFile ? (
                          <div className="flex items-center gap-2 text-xs text-mist">
                            <Loader2 size={16} className="animate-spin text-horizon" />
                            <span>Файл жүктелуде...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-mist">
                            <Upload size={18} className="text-horizon" />
                            <span className="text-xs font-medium text-ink">Файл таңдаңыз (PDF, Сурет...)</span>
                            <span className="text-[10px] text-mist">Макс. 10 МБ (Макс. 3 файл)</span>
                          </div>
                        )}
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploadingFile}
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setOpenDay(null)}
                      disabled={isPending || isUploadingFile}
                    >
                      Бас тарту
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleSave(day)}
                      disabled={isPending || isUploadingFile}
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