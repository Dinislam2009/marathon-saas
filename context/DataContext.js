"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as actions from "@/app/actions";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [currentStudentId, setCurrentStudentId] = useState(null);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  // Алғашқы рет жүктелгенде серверден статус алу және дедлайндарды тексеру
  useEffect(() => {
    async function init() {
      try {
        await actions.runDeadlineCheck();
        const initialState = await actions.fetchInitialState();
        if (initialState.currentStudentId) {
          setCurrentStudentId(initialState.currentStudentId);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setReady(true);
      }
    }
    init();
  }, []);

  // Әр минут сайын дедлайндарды автоматты жаңарту (серверде орындалады)
  useEffect(() => {
    const interval = setInterval(async () => {
      await actions.runDeadlineCheck();
      bump();
    }, 60000);
    return () => clearInterval(interval);
  }, [bump]);

  const value = {
    ready,
    tick,
    currentStudentId,
    setCurrentStudentId,

    addOrganizer: async (fields) => {
      const org = await actions.addOrganizerAction(fields);
      bump();
      return org;
    },
    setOrganizerSubscriptionStatus: async (orgId, status) => {
      await actions.setOrganizerSubscriptionStatusAction(orgId, status);
      bump();
    },
    createMarathon: async (orgId, fields) => {
      const marathon = await actions.createMarathonAction(orgId, fields);
      bump();
      return marathon;
    },
    upsertTask: async (marathonId, dayNumber, fields) => {
      const task = await actions.upsertTaskAction(marathonId, dayNumber, fields);
      bump();
      return task;
    },
    setStudentStatus: async (studentId, status) => {
      await actions.setStudentStatusAction(studentId, status);
      bump();
    },
    updateChecklist: async (studentId, marathonId, dayNumber, patch) => {
      const submission = await actions.updateChecklistAction(studentId, marathonId, dayNumber, patch);
      bump();
      return submission;
    },
    resetDemoData: () => {
      // PostgreSQL-де демо мәліметтерді нөлдеу серверлік деңгейде немесе қолмен жасалады
      bump();
    },

    addHabit: async (studentId, title) => {
      const habit = await actions.addHabitAction(studentId, title);
      bump();
      return habit;
    },
    toggleHabitToday: async (habitId) => {
      await actions.toggleHabitTodayAction(habitId);
      bump();
    },
    deleteHabit: async (habitId) => {
      await actions.deleteHabitAction(habitId);
      bump();
    },
    addMatrixTask: async (studentId, fields) => {
      const task = await actions.addMatrixTaskAction(studentId, fields);
      bump();
      return task;
    },
    toggleMatrixTaskDone: async (taskId) => {
      await actions.toggleMatrixTaskDoneAction(taskId);
      bump();
    },
    deleteMatrixTask: async (taskId) => {
      await actions.deleteMatrixTaskAction(taskId);
      bump();
    },
    sendMessage: async (orgId, studentId, studentName, text) => {
      const message = await actions.sendMessageAction(orgId, studentId, studentName, text);
      bump();
      return message;
    },
    addMentor: async (orgId, fields) => {
      const mentor = await actions.addMentorAction(orgId, fields);
      bump();
      return mentor;
    },
    assignMentorToStudent: async (studentId, mentorId) => {
      await actions.assignMentorToStudentAction(studentId, mentorId);
      bump();
    },
    addInvitation: async (marathonId, orgId, role, fields) => {
      const invite = await actions.addInvitationAction(marathonId, orgId, role, fields);
      bump();
      return invite;
    },
    addStudentToMarathon: async (marathonId, fields) => {
      const student = await actions.addStudentToMarathonAction(marathonId, fields);
      bump();
      return student;
    },
    addStudentInvitationByMentor: async (mentorId, marathonId, fields) => {
      const invite = await actions.addStudentInvitationByMentorAction(mentorId, marathonId, fields);
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