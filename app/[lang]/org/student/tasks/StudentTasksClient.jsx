"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  CheckCircle2, Lock, Send, Loader2, Trophy, 
  Sparkles, ArrowRight, PlayCircle, AlertCircle, UploadCloud, FileCheck
} from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

const getKinescopeUrl = (url) => {
  if (!url) return "";
  if (url.includes("kinescope.io/embed/")) {
    const cleanId = url.split("kinescope.io/embed/")[1]?.split("?")[0];
    return `https://kinescope.io/${cleanId}`;
  }
  return url;
};

// ⚡ KINESCOPE PLAYER (localStorage арқылы пайызды сақтау)
function KinescopePlayer({ taskId, videoUrl, title, onProgressUpdate, currentProgress = 0, isRu }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!videoUrl) return;

    let isMounted = true;

    const loadApiScript = () => {
      return new Promise((resolve) => {
        if (window.Kinescope?.IframePlayer) {
          resolve();
          return;
        }
        const existingScript = document.getElementById("kinescope-iframe-api");
        if (existingScript) {
          existingScript.addEventListener("load", resolve);
          return;
        }
        const script = document.createElement("script");
        script.id = "kinescope-iframe-api";
        script.src = "https://player.kinescope.io/latest/iframe.player.js";
        script.async = true;
        script.onload = resolve;
        document.body.appendChild(script);
      });
    };

    loadApiScript().then(() => {
      if (!isMounted || !containerRef.current || !window.Kinescope) return;

      window.Kinescope.IframePlayer.create(containerRef.current, {
        url: getKinescopeUrl(videoUrl),
        size: { width: "100%", height: "100%" },
        ui: { language: isRu ? "ru" : "kk", controls: true }
      })
        .then((player) => {
          if (!isMounted) return;
          playerRef.current = player;

          player.on(player.Events.TimeUpdate, (event) => {
            if (event?.data?.percent !== undefined) {
              const pct = Math.floor(event.data.percent);
              onProgressUpdate(pct);
            }
          });

          player.on(player.Events.Ended, () => {
            onProgressUpdate(100);
          });
        })
        .catch((err) => console.error("Kinescope player error:", err));
    });

    return () => {
      isMounted = false;
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [videoUrl, isRu]);

  return (
    <div className="space-y-3">
      <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-sm relative">
        <div ref={containerRef} className="w-full h-full"></div>
      </div>

      <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-2">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="flex items-center gap-1.5 text-purple-900">
            <PlayCircle className="w-4 h-4 text-purple-600" />
            {isRu ? "Прогресс просмотра видео:" : "Видео көрілу барысы:"}
          </span>
          <span className={currentProgress >= 85 ? "text-emerald-600 font-extrabold" : "text-purple-700 font-bold"}>
            {currentProgress}% {currentProgress >= 85 ? (isRu ? "✓ (Доступ разрешен)" : "✓ (Рұқсат берілді)") : (isRu ? "(Посмотрите не менее 85%)" : "(Кемінде 85% көріңіз)")}
          </span>
        </div>

        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              currentProgress >= 85 ? "bg-emerald-500" : "bg-purple-600"
            }`}
            style={{ width: `${currentProgress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default function StudentTasksClient({ initialData }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const { student, marathon, tasks = [], submissions = [] } = initialData || {};

  const [activeDay, setActiveDay] = useState(1);
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  
  const [videoProgress, setVideoProgress] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [checklists, setChecklists] = useState({});
  const [rewardModal, setRewardModal] = useState(null);

  const duration = marathon?.durationDays || 21;
  const daysArray = Array.from({ length: duration }, (_, i) => i + 1);

  const dayTasks = tasks.filter((t) => Number(t.dayNumber) === Number(activeDay));
  const now = new Date();

  // ⚡ localStorage-тан сақталған пайыздарды оқып алу
  useEffect(() => {
    const savedProgress = {};
    tasks.forEach((t) => {
      const localVal = localStorage.getItem(`task_progress_${t.id}`);
      if (localVal) {
        savedProgress[t.id] = Number(localVal);
      }
    });
    setVideoProgress(savedProgress);
  }, [tasks]);

  const handleVideoProgress = (taskId, pct) => {
    setVideoProgress((prev) => {
      const current = prev[taskId] || 0;
      const newPct = Math.max(current, pct);
      localStorage.setItem(`task_progress_${taskId}`, newPct);
      return { ...prev, [taskId]: newPct };
    });
  };

  // 🔒 КҮННІҢ АШЫҚ/БҰҒАТТАУЛЫ ЕКЕНІН ТЕКСЕРУ
  const checkIsDayUnlocked = (dayNum) => {
    if (dayNum === 1) return true;

    const dayTask = tasks.find((t) => Number(t.dayNumber) === Number(dayNum));

    if (dayTask && dayTask.availableAt) {
      const availDate = new Date(dayTask.availableAt);
      if (!isNaN(availDate.getTime())) {
        return now >= availDate;
      }
    }

    const prevDayTasks = tasks.filter((t) => Number(t.dayNumber) === dayNum - 1);
    if (prevDayTasks.length > 0) {
      const isPrevDayDone = prevDayTasks.every((pt) => 
        submissions.some((s) => s.taskId === pt.id && (s.status === "SUBMITTED" || s.status === "submitted" || s.status === "APPROVED"))
      );
      if (!isPrevDayDone) return false;
    }

    if (marathon?.startDate) {
      const startDate = new Date(marathon.startDate);
      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + (dayNum - 1));
      targetDate.setHours(0, 0, 0, 0);

      return now >= targetDate;
    }

    return false;
  };

  // ⚡ Нақты ОСЫ тапсырманың орындалғанын тексеру
  const isTaskSubmitted = (taskId) => {
    return submissions.some((s) => s.taskId === taskId && (s.status === "SUBMITTED" || s.status === "submitted" || s.status === "APPROVED"));
  };

  // 📁 Файл таңдағанда тексеру (Макс 10MB)
  const handleFileChange = (taskId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(isRu ? `Файл слишком большой! Максимальный размер: ${MAX_SIZE_MB} МБ` : `Файл көлемі Тым үлкен! Ең максималды шек: ${MAX_SIZE_MB} МБ`);
      e.target.value = "";
      return;
    }

    setSelectedFiles((prev) => ({ ...prev, [taskId]: file }));
  };

  const handleSubmitTask = async (task) => {
    const progress = videoProgress[task.id] || 0;
    const submitted = isTaskSubmitted(task.id);

    // 85% АСУЫН ТЕКСЕРУ
    if (task.videoUrl && task.videoUrl.includes("kinescope.io") && progress < 85 && !submitted) {
      alert(isRu ? "Чтобы сдать задание, посмотрите видео не менее чем на 85%!" : "Есепті өткізу үшін видеоны кем дегенде 85% көруіңіз керек!");
      return;
    }

    if (submittingTaskId || submitted) return;

    const uploadedFile = selectedFiles[task.id];
    const taskChecklist = checklists[task.id] || { done: false };

    if (task.verificationType === "SCREENSHOT" && !uploadedFile) {
      alert(isRu ? "Пожалуйста, выберите фото или файл задания!" : "Өтініш, тапсырманың фотосын немесе файлын таңдаңыз!");
      return;
    }

    setSubmittingTaskId(task.id);
    try {
      let fileUrl = null;

      // Файлды base64 ретінде дайындау
      if (uploadedFile) {
        fileUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(uploadedFile);
        });
      }

      const submitFn = actions.submitTaskAction || actions.submitTask;
      let res = null;

      if (typeof submitFn === "function") {
        res = await submitFn({
          studentId: student.id,
          taskId: task.id,
          dayNumber: activeDay,
          checklist: taskChecklist,
          fileUrl: fileUrl,
          marathonId: marathon?.id,
        });
      }

      if (res?.ok) {
        const pointsEarned = res?.earnedPoints || task.points || 10;
        setRewardModal({
          points: pointsEarned,
          taskTitle: isRu ? (task.titleRu || task.title) : (task.titleKz || task.title),
          day: activeDay,
        });
      } else {
        alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || (isRu ? "Не удалось отправить" : "Жіберу мүмкін болмады")));
      }
    } catch (err) {
      console.error("Submit task error:", err);
      alert(isRu ? "Произошла ошибка при отправке на сервер." : "Серверге жіберу кезінде қате орын алды.");
    } finally {
      setSubmittingTaskId(null);
    }
  };

  const handleCloseRewardModal = () => {
    setRewardModal(null);
    window.location.reload();
  };

  return (
    <div className="space-y-6 w-full pb-8 relative font-sans text-slate-900">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100">
            {marathon?.title || "Марафон"}
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
            {isRu ? "Ежедневные задания" : "Күнделікті Тапсырмалар"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isRu ? "Смотрите видео и сдавайте ежедневные отчеты." : "Видеоны қарап, күнделікті есеп тапсырыңыз."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-2xl">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <div className="text-[10px] font-bold text-amber-600 uppercase">
                {isRu ? "Ваши общие баллы" : "Жалпы Баллыңыз"}
              </div>
              <div className="text-sm font-extrabold text-amber-900">{student?.points || 0} XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔒 КҮНДЕР ТАСПАСЫ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {daysArray.map((dayNum) => {
          const count = tasks.filter((t) => Number(t.dayNumber) === Number(dayNum)).length;
          const isActive = activeDay === dayNum;
          const isDayUnlocked = checkIsDayUnlocked(dayNum);

          return (
            <button
              key={dayNum}
              disabled={!isDayUnlocked}
              onClick={() => isDayUnlocked && setActiveDay(dayNum)}
              className={`px-4 py-3 rounded-2xl font-bold text-xs shrink-0 flex items-center gap-2 border transition-all ${
                !isDayUnlocked
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                  : isActive
                  ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200 scale-105 cursor-pointer"
                  : "bg-white text-gray-600 border-gray-100 hover:border-gray-200 cursor-pointer"
              }`}
            >
              <span>{dayNum}-{isRu ? "День" : "Күн"}</span>
              {!isDayUnlocked ? (
                <Lock className="w-3 h-3 text-gray-400" />
              ) : (
                count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-purple-700 text-white" : "bg-purple-50 text-purple-700"
                  }`}>
                    {count}
                  </span>
                )
              )}
            </button>
          );
        })}
      </div>

      {dayTasks.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm space-y-2">
          <Lock className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">
            {isRu ? `На день ${activeDay} задания еще не добавлены` : `${activeDay}-күнге тапсырмалар әлі енгізілмеген`}
          </h3>
          <p className="text-xs text-gray-400">
            {isRu ? "Вы сможете увидеть их здесь, когда куратор добавит урок." : "Куратор сабақ қосқан кезде осы жерден көре аласыз."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dayTasks.map((task, index) => {
            const isUnlocked = checkIsDayUnlocked(task.dayNumber);
            const submitted = isTaskSubmitted(task.id);
            const isSubmitting = submittingTaskId === task.id;
            const progress = videoProgress[task.id] || 0;
            const isKinescope = task.videoUrl?.includes("kinescope.io");
            
            const isVideoReady = !isKinescope || progress >= 85 || submitted;
            const displayTitle = isRu ? (task.titleRu || task.title) : (task.titleKz || task.title);
            const displayContent = isRu ? (task.contentRu || task.content) : (task.contentKz || task.content);

            return (
              <div key={task.id || index} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">
                      #{index + 1} {isRu ? "Задание" : "Тапсырма"}
                    </span>
                    <h2 className="text-lg font-extrabold text-gray-900">{displayTitle}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      +{task.points || 10} XP
                    </span>
                    {submitted && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {isRu ? "Выполнено" : "Орындалды"}
                      </span>
                    )}
                  </div>
                </div>

                {!isUnlocked ? (
                  <div className="py-12 text-center space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">
                      {isRu ? "Урок еще не открыт" : "Сабақ әлі ашылған жоқ"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {isRu ? "Этот урок автоматически откроется ученикам в назначенное время." : "Бұл сабақ белгіленген уақытта оқушыларға автоматты түрде ашылады."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      {task.videoUrl && (
                        <KinescopePlayer
                          taskId={task.id}
                          videoUrl={task.videoUrl}
                          title={displayTitle}
                          currentProgress={progress}
                          onProgressUpdate={(pct) => handleVideoProgress(task.id, pct)}
                          isRu={isRu}
                        />
                      )}

                      {displayContent && (
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                          {displayContent}
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4 h-fit">
                      <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">
                        {isRu ? "Сдача отчёта" : "Есеп Өткізу"}
                      </h4>

                      {/* 📁 ТҮРІ 1: ФАЙЛ НЕ МЕДИА ЖҮКТЕУ */}
                      {task.verificationType === "SCREENSHOT" ? (
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold text-gray-600">
                            {isRu ? "Загрузить файл или фото (Макс 10 МБ) *" : "Файл немесе Фото жүктеу (Макс 10 МБ) *"}
                          </label>
                          <label className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                            submitted || !isVideoReady
                              ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"
                              : selectedFiles[task.id]
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                              : "bg-white border-purple-200 hover:border-purple-400 text-gray-600"
                          }`}>
                            <input
                              type="file"
                              accept="image/*,.pdf,.doc,.docx"
                              disabled={submitted || !isVideoReady}
                              onChange={(e) => handleFileChange(task.id, e)}
                              className="hidden"
                            />
                            {selectedFiles[task.id] ? (
                              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                                <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                                <span className="truncate max-w-[180px]">{selectedFiles[task.id].name}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 text-center">
                                <UploadCloud className="w-6 h-6 text-purple-600" />
                                <span className="text-[11px] font-bold text-gray-700">
                                  {isRu ? "Выберите файл" : "Файлды таңдаңыз"}
                                </span>
                                <span className="text-[9px] text-gray-400">PNG, JPG, PDF (Макс 10 МБ)</span>
                              </div>
                            )}
                          </label>
                        </div>
                      ) : (
                        /* ☑️ ТҮРІ 2: ҚАРАПАЙЫМ БЕЛГІЛЕУ (ЧЕК-ЛИСТ) */
                        <div className="space-y-2">
                          <label className="flex items-center gap-2.5 p-3 bg-white rounded-2xl border border-gray-200 cursor-pointer hover:border-purple-300">
                            <input
                              type="checkbox"
                              disabled={submitted || !isVideoReady}
                              checked={submitted || !!checklists[task.id]?.done}
                              onChange={(e) =>
                                setChecklists({
                                  ...checklists,
                                  [task.id]: { done: e.target.checked },
                                })
                              }
                              className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                            />
                            <span className="text-xs font-bold text-gray-700">
                              {isRu ? "Задание полностью выполнено" : "Тапсырма толық орындалды"}
                            </span>
                          </label>
                        </div>
                      )}

                      {!isVideoReady && !submitted && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-[11px] text-amber-800 font-medium">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            {isRu 
                              ? "Сдача отчета станет доступна после просмотра видео не менее чем на 85%." 
                              : "Видеоны кемінде 85% көргенде есеп тапсыру ашылады."}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => handleSubmitTask(task)}
                        disabled={isSubmitting || submitted || !isVideoReady}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                          submitted
                            ? "bg-emerald-500 text-white cursor-default"
                            : !isVideoReady
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-700 text-white active:scale-95 shadow-purple-200"
                        }`}
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : submitted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> {isRu ? "Сдано" : "Тапсырылды"}
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" /> {isRu ? "Отправить отчет" : "Есепті Жіберу"} (+{task.points || 10} XP)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rewardModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-5 border border-purple-100">
            <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[10px] font-extrabold uppercase rounded-full">
                {rewardModal.day}-{isRu ? "День Задание" : "Күн Тапсырмасы"}
              </span>
              <h3 className="text-xl font-black text-gray-900 pt-2">
                {isRu ? "Отличная работа! 🎉" : "Керемет Жұмыс! 🎉"}
              </h3>
              <p className="text-xs font-semibold text-gray-500 line-clamp-2">
                "{rewardModal.taskTitle}" {isRu ? "задание успешно выполнено!" : "тапсырмасы сәтті орындалды!"}
              </p>
            </div>

            <div className="py-3 px-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-xl font-black text-amber-900">+{rewardModal.points} XP</span>
            </div>

            <button
              onClick={handleCloseRewardModal}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-purple-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{isRu ? "Продолжить" : "Жалғастыру"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}