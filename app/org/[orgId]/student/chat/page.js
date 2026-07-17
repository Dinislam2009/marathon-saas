"use client";

import { use, useState, useRef, useEffect } from "react";
import { Send, MessageCircle } from "lucide-react";
import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import LoadingState from "@/components/ui/LoadingState";

export default function ChatPage({ params }) {
  const { orgId } = use(params);
  const { ready, tick, currentStudentId, sendMessage } = useData();
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tick]);

  if (!ready || !currentStudentId) return <LoadingState />;

  const student = db.getStudent(currentStudentId);
  const messages = db.getMessagesByOrg(orgId);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(orgId, student.id, student.name, text.trim());
    setText("");
  }

  return (
    <div key={tick} className="flex flex-col h-[calc(100vh-11rem)]">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle size={20} className="text-horizon-dark" />
        <h1 className="font-display text-2xl font-semibold text-ink">Топ чаты</h1>
      </div>
      <p className="text-xs text-mist mb-4">Тек осы ұйымның қатысушылары көреді</p>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-2">
        {messages.length === 0 && (
          <p className="text-center text-mist text-sm py-10">Әзірге хабарлама жоқ. Бірінші боп жаз!</p>
        )}
        {messages.map((m) => {
          const mine = m.studentId === student.id;
          return (
            <div key={m.id} className={cn("max-w-[75%] flex flex-col", mine ? "self-end items-end" : "self-start items-start")}>
              {!mine && <span className="text-[10px] text-mist mb-0.5 ml-1">{m.studentName}</span>}
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2 text-sm",
                  mine ? "bg-horizon text-white rounded-br-sm" : "bg-white border border-mist-light text-ink rounded-bl-sm"
                )}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Хабарлама жазу..."
          className="flex-1 rounded-full border border-mist-light px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          className="h-10 w-10 rounded-full bg-horizon text-white flex items-center justify-center shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
