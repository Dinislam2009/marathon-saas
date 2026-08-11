"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

export default function AddOrganizerModal({ isOpen, onClose, onAddOrganizer, onCheckUser }) {
  const params = useParams();
  const lang = params?.lang || "ru";
  const isRu = lang === "ru";

  const [contactInput, setContactInput] = useState("");

  const [status, setStatus] = useState("idle"); // idle, checking, ready, invalid_role, already_organizer, not_found
  const [statusMessage, setStatusMessage] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  if (!isOpen) return null;

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";

    let result = "+7 (";
    const cleanBody = digits.startsWith("7") ? digits.slice(1) : digits;

    if (cleanBody.length > 0) result += cleanBody.substring(0, 3);
    if (cleanBody.length >= 3) result += `) ${cleanBody.substring(3, 6)}`;
    if (cleanBody.length >= 6) result += `-${cleanBody.substring(6, 8)}`;
    if (cleanBody.length >= 8) result += `-${cleanBody.substring(8, 10)}`;

    return result;
  };

  const scheduleVerify = (value, isEmail) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      verifyUser(value, isEmail);
    }, 300);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;

    if (!val.trim()) {
      setContactInput("");
      clearTimeout(debounceRef.current);
      setStatus("idle");
      setStatusMessage("");
      setFoundUser(null);
      return;
    }

    const isEmail = val.includes("@") || /[a-zA-Z]/.test(val);
    let formattedVal = isEmail ? val : formatPhoneNumber(val);

    setContactInput(formattedVal);

    const rawDigits = formattedVal.replace(/\D/g, "");

    if ((isEmail && formattedVal.trim().length > 4) || rawDigits.length === 11) {
      scheduleVerify(formattedVal.trim(), isEmail);
    } else {
      clearTimeout(debounceRef.current);
      setStatus("idle");
      setStatusMessage("");
      setFoundUser(null);
    }
  };

  const verifyUser = async (value, isEmail) => {
    setStatus("checking");
    try {
      if (onCheckUser) {
        const result = await onCheckUser(value, isEmail);
        setStatus(result?.status || "not_found");
        setStatusMessage(result?.message || "");
        setFoundUser(result?.user || null);
      } else {
        setStatus("not_found");
      }
    } catch {
      setStatus("not_found");
      setStatusMessage(isRu ? "Ошибка при проверке." : "Тексеру кезінде қате шықты.");
      setFoundUser(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status !== "ready") return;

    try {
      setIsSubmitting(true);
      await onAddOrganizer({
        userId: foundUser?.id,
        name: foundUser?.name,
        email: foundUser?.email,
        phone: foundUser?.phone,
      });

      setContactInput("");
      setStatus("idle");
      setStatusMessage("");
      setFoundUser(null);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl transition-all">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-gray-900">
            {isRu ? "Добавить Организатора" : "Ұйымдастырушы қосу"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EMAIL НЕМЕСЕ ТЕЛЕФОН */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              {isRu ? "Email или Номер телефона" : "Email немесе Телефон нөмірі"}
            </label>

            <input
              type="text"
              placeholder={isRu ? "email@mail.ru или +7 (7XX)..." : "email@mail.kz немесе +7 (7XX)..."}
              value={contactInput}
              onChange={handleInputChange}
              required
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all text-xs font-medium bg-gray-50"
            />

            {/* 🔍 CHECKING STATE */}
            {status === "checking" && (
              <div className="mt-3 p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-600 font-medium animate-pulse">
                🔍 {isRu ? "Проверка данных в базе..." : "Базадан деректер тексерілуде..."}
              </div>
            )}

            {/* ✅ READY STATE (Табылды, тағайындауға дайын) */}
            {status === "ready" && foundUser && (
              <div className="mt-3 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
                    ✓ {isRu ? "Готово к назначению!" : "Тағайындауға дайын!"}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                    {foundUser.role || "USER"}
                  </span>
                </div>
                <div className="text-xs space-y-1 text-emerald-950 font-medium">
                  <p><span className="text-emerald-700 font-bold">{isRu ? "ФИО: " : "Аты-жөні: "}</span> {foundUser.name}</p>
                  <p><span className="text-emerald-700 font-bold">{isRu ? "Почта: " : "Поштасы: "}</span> {foundUser.email || "—"}</p>
                  <p><span className="text-emerald-700 font-bold">{isRu ? "Телефон: " : "Телефоны: "}</span> {foundUser.phone || "—"}</p>
                </div>
              </div>
            )}

            {/* ⛔ INVALID ROLE STATE */}
            {status === "invalid_role" && (
              <div className="mt-3 p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-700 space-y-1">
                <p className="font-bold">⛔ {statusMessage}</p>
                {foundUser && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    {isRu ? "Пользователь: " : "Пайдаланушы: "}<span className="font-semibold">{foundUser.name}</span>
                  </p>
                )}
              </div>
            )}

            {/* ⚠️ ALREADY ORGANIZER */}
            {status === "already_organizer" && (
              <div className="mt-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <p className="font-bold">⚠️ {statusMessage}</p>
                {foundUser && (
                  <p className="text-[11px] text-amber-700 font-medium">
                    {isRu ? "Организатор: " : "Ұйымдастырушы: "}<span className="font-semibold">{foundUser.name}</span>
                  </p>
                )}
              </div>
            )}

            {/* ❌ NOT FOUND STATE (Базада жоқ) */}
            {status === "not_found" && (
              <div className="mt-3 p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-700 font-medium">
                ✕ {isRu ? "Пользователь не найден на платформе (Не зарегистрирован)." : "Платформада бұл пайдаланушы табылмады (Тіркелмеген)."}
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting || status !== "ready"}
            className="w-full rounded-2xl bg-purple-600 py-3.5 font-extrabold text-xs text-white shadow-md shadow-purple-200 transition-all hover:bg-purple-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-3 cursor-pointer"
          >
            {isSubmitting
              ? (isRu ? "Назначение..." : "Тағайындалуда...")
              : (isRu ? "Назначить Организатором" : "Организатор рөлін беру")}
          </button>
        </form>
      </div>
    </div>
  );
}