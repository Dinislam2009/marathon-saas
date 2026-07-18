"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as db from "@/lib/data";

const DataContext = createContext(null);

// Loads the demo dataset once, runs the deadline/lives check, and
// exposes every mutation as an action that also triggers a re-render.
//
// Reads work differently: components call the lib/data.js query
// functions (getStudentsByMarathon, getLeaderboard, ...) directly in
// their render body — localStorage reads are synchronous, so this is
// safe. Every consumer of this context re-renders whenever `tick`
// changes, which is what makes those direct reads "reactive" without
// duplicating every collection into React state as well.
export function DataProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [currentStudentId, setCurrentStudentId] = useState(null);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    db.initIfEmpty();
    db.checkMissedDeadlines();

    const org = db.getOrganizers()[0];
    const marathon = org ? db.getMarathonsByOrg(org.id)[0] : null;
    const firstStudent = marathon ? db.getStudentsByMarathon(marathon.id)[0] : null;
    if (firstStudent) setCurrentStudentId(firstStudent.id);

    setReady(true);
  }, []);

  // Client-side stand-in for a server cron: re-checks deadlines every
  // minute so a tab left open past 23:00 updates on its own. See the
  // migration note above checkMissedDeadlines() in lib/data.js.
  useEffect(() => {
    const interval = setInterval(() => {
      db.checkMissedDeadlines();
      bump();
    }, 60000);
    return () => clearInterval(interval);
  }, [bump]);

  const value = {
    ready,
    tick,
    currentStudentId,
    setCurrentStudentId,

    addOrganizer: (fields) => {
      const org = db.addOrganizer(fields);
      bump();
      return org;
    },
    setOrganizerSubscriptionStatus: (orgId, status) => {
      db.setOrganizerSubscriptionStatus(orgId, status);
      bump();
    },
    createMarathon: (orgId, fields) => {
      const marathon = db.createMarathon(orgId, fields);
      bump();
      return marathon;
    },
    upsertTask: (marathonId, dayNumber, fields) => {
      const task = db.upsertTask(marathonId, dayNumber, fields);
      bump();
      return task;
    },
    setStudentStatus: (studentId, status) => {
      db.setStudentStatus(studentId, status);
      bump();
    },
    updateChecklist: (studentId, marathonId, dayNumber, patch) => {
      const submission = db.updateChecklist(studentId, marathonId, dayNumber, patch);
      bump();
      return submission;
    },
    resetDemoData: () => {
      db.resetDemoData();
      bump();
    },

    addHabit: (studentId, title) => {
      const habit = db.addHabit(studentId, title);
      bump();
      return habit;
    },
    toggleHabitToday: (habitId) => {
      db.toggleHabitToday(habitId);
      bump();
    },
    deleteHabit: (habitId) => {
      db.deleteHabit(habitId);
      bump();
    },
    addMatrixTask: (studentId, fields) => {
      const task = db.addMatrixTask(studentId, fields);
      bump();
      return task;
    },
    toggleMatrixTaskDone: (taskId) => {
      db.toggleMatrixTaskDone(taskId);
      bump();
    },
    deleteMatrixTask: (taskId) => {
      db.deleteMatrixTask(taskId);
      bump();
    },
    sendMessage: (orgId, studentId, studentName, text) => {
      const message = db.sendMessage(orgId, studentId, studentName, text);
      bump();
      return message;
    },
    addMentor: (orgId, fields) => {
      const mentor = db.addMentor(orgId, fields);
      bump();
      return mentor;
    },
    assignMentorToStudent: (studentId, mentorId) => {
      db.assignMentorToStudent(studentId, mentorId);
      bump();
    },
    addInvitation: (marathonId, orgId, role, fields) => {
      const invite = db.addInvitation(marathonId, orgId, role, fields);
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
