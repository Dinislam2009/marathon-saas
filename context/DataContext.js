"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as actions from "@/app/actions";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [marathons, setMarathons] = useState([]);

  // Компоненттерді қайта рендерлеуге арналған триггер
  const bump = useCallback(() => setTick((t) => t + 1), []);

  // Марафондарды базадан қайта жүктеу
  const refreshData = useCallback(async (orgId) => {
    try {
      const getMarathonsFn = actions["getMarathonsByOrgId"] || actions["getMarathons"];
      if (typeof getMarathonsFn === "function") {
        const list = await getMarathonsFn(orgId);
        setMarathons(list || []);
      }
    } catch (err) {
      console.error("Fetch marathons error:", err);
    }
  }, []);

  // Алғашқы жүктелгенде орындалатын инициализация
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        if (typeof actions["runDeadlineCheck"] === "function") {
          await actions["runDeadlineCheck"]();
        }
        if (typeof actions["fetchInitialState"] === "function") {
          const initialState = await actions["fetchInitialState"]();
          if (isMounted && initialState?.currentStudentId) {
            setCurrentStudentId(initialState.currentStudentId);
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        if (isMounted) setReady(true);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Серверлік функцияларды қауіпсіз орындау көмекшісі
  const safeCall = async (fn, ...args) => {
    if (typeof fn === "function") {
      try {
        const res = await fn(...args);
        bump();
        return res;
      } catch (err) {
        console.error("Action execution error:", err);
        return { ok: false, error: err.message };
      }
    }
    return null;
  };

  // actions.js ішінен функцияны екі түрлі стильмен де табуға арналған көмекші
  const getAction = (camelName, lowerName) => {
    return actions[camelName] || actions[lowerName];
  };

  const value = {
    ready,
    tick,
    triggerUpdate: bump,
    currentStudentId,
    setCurrentStudentId,
    marathons,
    refreshData,

    getMarathon: (id) => marathons.find((m) => String(m.id) === String(id)),

    // Организатор
    addOrganizer: (fields) => safeCall(actions["addOrganizer"], fields),
    setOrganizerSubscriptionStatus: (orgId, status) =>
      safeCall(actions["setOrganizerSubscriptionStatus"], orgId, status),

    // Марафондар
    createMarathon: async (orgId, fields) => {
      return safeCall(actions["createMarathon"], { orgId, ...fields });
    },

    // Тапсырмалар
    upsertTask: (marathonId, dayNumber, fields) =>
      safeCall(actions["upsertTask"], marathonId, dayNumber, fields),
    setStudentStatus: (studentId, status) =>
      safeCall(actions["setStudentStatus"], studentId, status),
    updateChecklist: (studentId, marathonId, dayNumber, patch) =>
      safeCall(actions["updateChecklist"], studentId, marathonId, dayNumber, patch),
    resetDemoData: () => bump(),

    // Әдеттер
    addHabit: (studentId, title) => safeCall(actions["addHabit"], studentId, title),
    toggleHabitToday: (habitId) => safeCall(actions["toggleHabitToday"], habitId),
    deleteHabit: (habitId) => safeCall(actions["deleteHabit"], habitId),

    // Матрица Эйзенхауэра
    addMatrixTask: (studentId, fields) => safeCall(actions["addMatrixTask"], studentId, fields),
    toggleMatrixTaskDone: (taskId) => safeCall(actions["toggleMatrixTaskDone"], taskId),
    deleteMatrixTask: (taskId) => safeCall(actions["deleteMatrixTask"], taskId),

    // Чат
    sendMessage: (orgId, studentId, studentName, text) =>
      safeCall(actions["sendMessage"], orgId, studentId, studentName, text),

    // Куратор функциялары
    addCurator: (data) => safeCall(getAction("addCurator", "addcurator"), data),
    addcurator: (data) => safeCall(getAction("addCurator", "addcurator"), data),

    assignCuratorToStudent: (studentId, curatorId) =>
      safeCall(getAction("assignCuratorToStudent", "assigncuratorToStudent"), studentId, curatorId),
    assigncuratorToStudent: (studentId, curatorId) =>
      safeCall(getAction("assignCuratorToStudent", "assigncuratorToStudent"), studentId, curatorId),

    addStudentInvitationByCurator: (curatorId, marathonId, fields) =>
      safeCall(
        getAction("addStudentInvitationByCurator", "addStudentInvitationBycurator"),
        curatorId,
        marathonId,
        fields
      ),
    addStudentInvitationBycurator: (curatorId, marathonId, fields) =>
      safeCall(
        getAction("addStudentInvitationByCurator", "addStudentInvitationBycurator"),
        curatorId,
        marathonId,
        fields
      ),

    // Шақырулар мен Оқушылар
    addInvitation: (marathonId, orgId, role, fields) =>
      safeCall(actions["addInvitation"], marathonId, orgId, role, fields),
    addStudentToMarathon: (marathonId, fields) =>
      safeCall(actions["addStudentToMarathon"], marathonId, fields),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData() must be called inside <DataProvider>");
  return ctx;
}