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

  // Марафондар тізімін жүктеу функциясы
  const refreshData = useCallback(async () => {
    try {
      if (actions.getMarathons) {
        const list = await actions.getMarathons();
        setMarathons(list || []);
      }
    } catch (err) {
      console.error("Fetch marathons error:", err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        if (actions.runDeadlineCheck) {
          await actions.runDeadlineCheck();
        }
        if (actions.fetchInitialState) {
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

  const value = {
    ready,
    tick,
    currentStudentId,
    setCurrentStudentId,
    marathons,
    refreshData,

    getMarathon: (id) => marathons.find((m) => String(m.id) === String(id)),

    addOrganizer: async (fields) => {
      if (!actions.addOrganizer) return null;
      const org = await actions.addOrganizer(fields);
      bump();
      return org;
    },
    setOrganizerSubscriptionStatus: async (orgId, status) => {
      if (actions.setOrganizerSubscriptionStatus) {
        await actions.setOrganizerSubscriptionStatus(orgId, status);
        bump();
      }
    },

    // ⚡ ДҰРЫСТАЛДЫ: Аргументтер бір объектіге біріктірілді ({ orgId, ...fields })
    createMarathon: async (orgId, fields) => {
      // actions.createMarathon немесе actions.createMarathonAction кайсысы бар соны алады
      const fn = actions.createMarathonAction || actions.createMarathon;
      if (fn) {
        const marathon = await fn({ orgId, ...fields });
        bump();
        return marathon;
      }
    },

    upsertTask: async (marathonId, dayNumber, fields) => {
      if (!actions.upsertTask) return null;
      const task = await actions.upsertTask(marathonId, dayNumber, fields);
      bump();
      return task;
    },
    setStudentStatus: async (studentId, status) => {
      if (actions.setStudentStatus) {
        await actions.setStudentStatus(studentId, status);
        bump();
      }
    },
    updateChecklist: async (studentId, marathonId, dayNumber, patch) => {
      if (!actions.updateChecklist) return null;
      const submission = await actions.updateChecklist(studentId, marathonId, dayNumber, patch);
      bump();
      return submission;
    },
    resetDemoData: () => {
      bump();
    },
    addHabit: async (studentId, title) => {
      if (!actions.addHabit) return null;
      const habit = await actions.addHabit(studentId, title);
      bump();
      return habit;
    },
    toggleHabitToday: async (habitId) => {
      if (actions.toggleHabitToday) {
        await actions.toggleHabitToday(habitId);
        bump();
      }
    },
    deleteHabit: async (habitId) => {
      if (actions.deleteHabit) {
        await actions.deleteHabit(habitId);
        bump();
      }
    },
    addMatrixTask: async (studentId, fields) => {
      if (!actions.addMatrixTask) return null;
      const task = await actions.addMatrixTask(studentId, fields);
      bump();
      return task;
    },
    toggleMatrixTaskDone: async (taskId) => {
      if (actions.toggleMatrixTaskDone) {
        await actions.toggleMatrixTaskDone(taskId);
        bump();
      }
    },
    deleteMatrixTask: async (taskId) => {
      if (actions.deleteMatrixTask) {
        await actions.deleteMatrixTask(taskId);
        bump();
      }
    },
    sendMessage: async (orgId, studentId, studentName, text) => {
      if (!actions.sendMessage) return null;
      const message = await actions.sendMessage(orgId, studentId, studentName, text);
      bump();
      return message;
    },
    addcurator: async (orgId, fields) => {
      if (!actions.addcurator) return null;
      const curator = await actions.addcurator(orgId, fields);
      bump();
      return curator;
    },
    assigncuratorToStudent: async (studentId, curatorId) => {
      if (actions.assigncuratorToStudent) {
        await actions.assigncuratorToStudent(studentId, curatorId);
        bump();
      }
    },
    addInvitation: async (marathonId, orgId, role, fields) => {
      if (!actions.addInvitation) return null;
      const invite = await actions.addInvitation(marathonId, orgId, role, fields);
      bump();
      return invite;
    },
    addStudentToMarathon: async (marathonId, fields) => {
      if (!actions.addStudentToMarathon) return null;
      const student = await actions.addStudentToMarathon(marathonId, fields);
      bump();
      return student;
    },
    addStudentInvitationBycurator: async (curatorId, marathonId, fields) => {
      if (!actions.addStudentInvitationBycurator) return null;
      const invite = await actions.addStudentInvitationBycurator(curatorId, marathonId, fields);
      bump();
      return invite;
    },
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData() must be called inside <DataProvider>");
  return ctx;
}