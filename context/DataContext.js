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
        await actions.runDeadlineCheck();
        const initialState = await actions.fetchInitialState();
        if (initialState?.currentStudentId) {
          setCurrentStudentId(initialState.currentStudentId);
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
      const org = await actions.addOrganizer(fields);
      bump();
      return org;
    },
    setOrganizerSubscriptionStatus: async (orgId, status) => {
      await actions.setOrganizerSubscriptionStatus(orgId, status);
      bump();
    },
    createMarathon: async (orgId, fields) => {
      const marathon = await actions.createMarathon(orgId, fields);
      bump();
      return marathon;
    },
    upsertTask: async (marathonId, dayNumber, fields) => {
      const task = await actions.upsertTask(marathonId, dayNumber, fields);
      bump();
      return task;
    },
    setStudentStatus: async (studentId, status) => {
      await actions.setStudentStatus(studentId, status);
      bump();
    },
    updateChecklist: async (studentId, marathonId, dayNumber, patch) => {
      const submission = await actions.updateChecklist(studentId, marathonId, dayNumber, patch);
      bump();
      return submission;
    },
    resetDemoData: () => {
      bump();
    },
    addHabit: async (studentId, title) => {
      const habit = await actions.addHabit(studentId, title);
      bump();
      return habit;
    },
    toggleHabitToday: async (habitId) => {
      await actions.toggleHabitToday(habitId);
      bump();
    },
    deleteHabit: async (habitId) => {
      await actions.deleteHabit(habitId);
      bump();
    },
    addMatrixTask: async (studentId, fields) => {
      const task = await actions.addMatrixTask(studentId, fields);
      bump();
      return task;
    },
    toggleMatrixTaskDone: async (taskId) => {
      await actions.toggleMatrixTaskDone(taskId);
      bump();
    },
    deleteMatrixTask: async (taskId) => {
      await actions.deleteMatrixTask(taskId);
      bump();
    },
    sendMessage: async (orgId, studentId, studentName, text) => {
      const message = await actions.sendMessage(orgId, studentId, studentName, text);
      bump();
      return message;
    },
    addMentor: async (orgId, fields) => {
      const mentor = await actions.addMentor(orgId, fields);
      bump();
      return mentor;
    },
    assignMentorToStudent: async (studentId, mentorId) => {
      await actions.assignMentorToStudent(studentId, mentorId);
      bump();
    },
    addInvitation: async (marathonId, orgId, role, fields) => {
      const invite = await actions.addInvitation(marathonId, orgId, role, fields);
      bump();
      return invite;
    },
    addStudentToMarathon: async (marathonId, fields) => {
      const student = await actions.addStudentToMarathon(marathonId, fields);
      bump();
      return student;
    },
    addStudentInvitationByMentor: async (mentorId, marathonId, fields) => {
      const invite = await actions.addStudentInvitationByMentor(mentorId, marathonId, fields);
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