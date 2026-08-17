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
import { useLanguage } from "@/context/LanguageContext"; // 👈 i18n қосылды

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
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const marathonId = resolvedParams?.marathonId;
  const orgId = resolvedParams?.orgId; // 👈 orgId алынды

  const router = useRouter();
  
  const { ready, getMarathon, triggerUpdate } = useData();
  
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
      const getTasksFn = actions.getTasksByMarathon;
      if (typeof getTasksFn === "function") {
        const tasksData = await getTasksFn(marathonId);
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
  if (!marathon) return <p className="p-6 text-slate-500 font-medium">{isRu ? "Марафон не найден." : "Марафон табылмады."}</p>;

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
      setUploadError(isRu ? "Введите название задания!" : "Тапсырма атауын енгізіңіз!");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          ...draft,
          marathonId,
          dayNumber: day,
        };

        const saveTaskFn = actions.createOrUpdateTask || actions.upsertTask;
        if (typeof saveTaskFn === "function") {
          await saveTaskFn(payload);
        }

        await fetchServerTasks();
        if (triggerUpdate) triggerUpdate();
        setOpenDay(null);
      } catch (err) {
        console.error("Save task error:", err);
        setUploadError((isRu ? "Ошибка сохранения: " : "Тапсырманы сақтау қателігі: ") + (err.message || ""));
      }
    });
  };

  const handleFileUpload = async (e) => {
    setUploadError("");
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentFiles = draft.fileUrls || [];

    if (currentFiles.length + files.length > MAX_FILES_COUNT) {
      setUploadError(
        isRu 
          ? `Максимум ${MAX_FILES_COUNT} файла на одно задание!` 
          : `Бір тапсырмаға максимум ${MAX_FILES_COUNT} файл тіркеуге болады!`
      );
      e.target.value = "";
      return;
    }

    setIsUploadingFile(true);

    try {
      const newUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          setUploadError(
            isRu 
              ? `Файл "${file.name}" слишком большой (макс. ${MAX_FILE_SIZE_MB} МБ)` 
              : `"${file.name}" файлы өте үлкен! Өлшемі ${MAX_FILE_SIZE_MB} МБ-тан аспауы керек.`
          );
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
            throw new Error(resData.error || resData.message || resData.statusCode || "Upload failed");
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
      setUploadError((isRu ? "Ошибка загрузки файла: " : "Файлды жүктеу қателігі: ") + (err.message || ""));
    } finally {
      setIsUploadingFile(false);
      e.target.value = "";
    }
  };

  // Маршруттар
  const backUrl = orgId ? `/${lang}/org/${orgId}/admin` : `/${lang}/org/admin`;
  const studentsUrl = orgId 
    ? `/${lang}/org/${orgId}/admin/marathons/${marathonId}/students`
    : `/${lang}/org/admin/marathons/${marathonId}/students`;

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-12">
      <div>
        <Link
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 w-fit mb-3 transition font-medium"
        >
          <ArrowLeft size={14} /> {isRu ? "Мои марафоны" : "Марафондарым"}
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-900">{marathon.title}</h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">
              {dbTasks.length} / {marathon.durationDays} {isRu ? "дней готово" : "күн дайын"}
            </p>
          </div>
          <Link href={studentsUrl}>
            <Button variant="secondary" className="gap-2 font-bold cursor-pointer">
              <Users size={16} /> {isRu ? "Участники" : "Оқушылар"}
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {days.map((day) => {
          const task = taskByDay[day];
          const isOpen = openDay === day;
          return (
            <Card key={day} padded={false} className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-xs">
              <button
                type="button"
                onClick={() => openEditor(day)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition cursor-pointer"
              >
                {task ? (
                  <CircleCheck size={18} className="text-emerald-600 shrink-0" />
                ) : (
                  <Circle size={18} className="text-slate-300 shrink-0" />
                )}
                <span className="text-xs font-bold text-slate-500 w-16 shrink-0">
                  {day}-{isRu ? "день" : "күн"}
                </span>
                <span className={cn("flex-1 text-sm truncate font-semibold", task ? "text-slate-900" : "text-slate-400 italic")}>
                  {task ? task.title : (isRu ? "Задание не добавлено" : "Тапсырма қосылмаған")}
                </span>
                <ChevronDown
                  size={16}
                  className={cn("text-slate-400 transition-transform shrink-0", isOpen && "rotate-180")}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-4 flex flex-col gap-3 bg-slate-50/50">
                  <input
                    autoFocus
                    placeholder={isRu ? "Название задания *" : "Тапсырма атауы *"}
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-purple-600"
                  />
                  <input
                    placeholder={isRu ? "Ссылка на видео (YouTube, Drive...)" : "Видео сілтемесі (YouTube, Google Drive...)"}
                    value={draft.videoUrl || ""}
                    onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-purple-600"
                  />
                  <textarea
                    rows={3}
                    placeholder={isRu ? "Текст задания..." : "Тапсырма мәтіні..."}
                    value={draft.content || ""}
                    onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-purple-600 resize-none"
                  />
                  
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-2">
                      {isRu ? "Формат проверки" : "Тексеру форматы"}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {Object.values(VERIFICATION_TYPE).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setDraft({ ...draft, verificationType: type })}
                          className={cn(
                            "rounded-xl px-3.5 py-1.5 text-xs font-bold border transition cursor-pointer",
                            draft.verificationType === type
                              ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                              : "border-slate-200 text-slate-600 bg-white hover:border-slate-300"
                          )}
                        >
                          {VERIFICATION_TYPE_LABELS[type]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-slate-600">
                        {isRu ? "Прикрепить материалы/файлы" : "Материал/Файл тіркеу"}
                      </p>
                      <span className="text-[10px] text-slate-400 font-bold">
                        ({(draft.fileUrls || []).length}/{MAX_FILES_COUNT})
                      </span>
                    </div>

                    {uploadError && (
                      <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={15} className="shrink-0 text-rose-600" />
                          <span>{uploadError}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setUploadError("")}
                          className="p-1 hover:bg-rose-100 rounded-lg transition text-rose-600 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {(draft.fileUrls || []).length > 0 && (
                      <div className="flex flex-col gap-2 mb-2">
                        {draft.fileUrls.map((url, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 bg-white">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-xs text-purple-600 font-bold hover:underline truncate max-w-[85%]"
                            >
                              <Paperclip size={14} className="shrink-0" />
                              <span className="truncate">{isRu ? `Открыть файл #${idx + 1}` : `Файл #${idx + 1} ашу`}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {(draft.fileUrls || []).length < MAX_FILES_COUNT && (
                      <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-4 hover:border-purple-500 hover:bg-purple-50/30 transition cursor-pointer">
                        {isUploadingFile ? (
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                            <Loader2 size={16} className="animate-spin text-purple-600" />
                            <span>{isRu ? "Загрузка файла..." : "Файл жүктелуде..."}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-500">
                            <Upload size={18} className="text-purple-600" />
                            <span className="text-xs font-bold text-slate-800">
                              {isRu ? "Выберите файл (PDF, Картинка...)" : "Файл таңдаңыз (PDF, Сурет...)"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {isRu ? "Макс. 10 МБ (до 3 файлов)" : "Макс. 10 МБ (Макс. 3 файл)"}
                            </span>
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

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setOpenDay(null)}
                      disabled={isPending || isUploadingFile}
                      className="text-xs font-bold"
                    >
                      {isRu ? "Отмена" : "Бас тарту"}
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleSave(day)}
                      disabled={isPending || isUploadingFile}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                    >
                      {isPending ? <Loader2 size={14} className="animate-spin" /> : (isRu ? "Сохранить" : "Сақтау")}
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