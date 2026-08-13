"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as actions from "@/app/actions";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [marathons, setMarathons] = useState([]);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  // Марафондар тізімін қауіпсіз жүктеу
  const refreshData = useCallback(async () => {
    try {
      const getMarathonsFn = actions.getMarathonsByOrgId || actions.getMarathons;
      if (typeof getMarathonsFn === "function") {
        const list = await getMarathonsFn();
        setMarathons(list || []);
      }
    } catch (err) {
      console.error("Fetch marathons error:", err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        if (typeof actions.runDeadlineCheck === "function") {
          await actions.runDeadlineCheck();
        }
        if (typeof actions.fetchInitialState === "function") {
          const initialState = await actions.fetchInitialState();
          if (initialState?.currentStudentId) {
            setCurrentStudentId(initialState.currentStudentId);
          }
        }
        await refreshData();
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setReady(true);
      }
    }
    init();
  }, [refreshData, tick]);

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

  const value = {
    ready,
    tick,
    currentStudentId,
    setCurrentStudentId,
    marathons,
    refreshData,

    getMarathon: (id) => marathons.find((m) => String(m.id) === String(id)),

    addOrganizer: (fields) => safeCall(actions.addOrganizer, fields),
    setOrganizerSubscriptionStatus: (orgId, status) => safeCall(actions.setOrganizerSubscriptionStatus, orgId, status),

    createMarathon: async (orgId, fields) => {
      const fn = actions.createMarathonAction || actions.createMarathon;
      return safeCall(fn, { orgId, ...fields });
    },

    upsertTask: (marathonId, dayNumber, fields) => safeCall(actions.upsertTask, marathonId, dayNumber, fields),
    setStudentStatus: (studentId, status) => safeCall(actions.setStudentStatus, studentId, status),
    updateChecklist: (studentId, marathonId, dayNumber, patch) => safeCall(actions.updateChecklist, studentId, marathonId, dayNumber, patch),
    resetDemoData: () => bump(),

    addHabit: (studentId, title) => safeCall(actions.addHabit, studentId, title),
    toggleHabitToday: (habitId) => safeCall(actions.toggleHabitToday, habitId),
    deleteHabit: (habitId) => safeCall(actions.deleteHabit, habitId),

    addMatrixTask: (studentId, fields) => safeCall(actions.addMatrixTask, studentId, fields),
    toggleMatrixTaskDone: (taskId) => safeCall(actions.toggleMatrixTaskDone, taskId),
    deleteMatrixTask: (taskId) => safeCall(actions.deleteMatrixTask, taskId),

    sendMessage: (orgId, studentId, studentName, text) => safeCall(actions.sendMessage, orgId, studentId, studentName, text),
    addcurator: (orgId, fields) => safeCall(actions.addcurator, orgId, fields),
    assigncuratorToStudent: (studentId, curatorId) => safeCall(actions.assigncuratorToStudent, studentId, curatorId),
    addInvitation: (marathonId, orgId, role, fields) => safeCall(actions.addInvitation, marathonId, orgId, role, fields),
    addStudentToMarathon: (marathonId, fields) => safeCall(actions.addStudentToMarathon, marathonId, fields),
    addStudentInvitationBycurator: (curatorId, marathonId, fields) => safeCall(actions.addStudentInvitationBycurator, curatorId, marathonId, fields),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData() must be called inside <DataProvider>");
  return ctx;
}