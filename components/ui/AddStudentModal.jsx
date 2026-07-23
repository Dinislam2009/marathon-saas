"use client";

import { useState } from "react";

export default function AddStudentModal({ isOpen, onClose, marathons, onAdd, onCheckStudent }) {
  const [selectedMarathon, setSelectedMarathon] = useState("");
  const [contactInput, setContactInput] = useState("+7 (7");
  
  const [status, setStatus] = useState("idle");
  const [foundUser, setFoundUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, "");
    let result = "+7 (7";
    const cleanBody = digits.startsWith("7") ? digits.slice(1) : digits;

    if (cleanBody.length > 0) result += cleanBody.substring(0, 2);
    if (cleanBody.length >= 2) result += `) ${cleanBody.substring(2, 5)}`;
    if (cleanBody.length >= 5) result += `-${cleanBody.substring(5, 7)}`;
    if (cleanBody.length >= 7) result += `-${cleanBody.substring(7, 9)}`;

    return result;
  };

  const handleInputChange = async (e) => {
    const val = e.target.value;
    
    if (val.includes("@")) {
      setContactInput(val);
      if (val.length > 4 && selectedMarathon) {
        verifyStudent(val, true, selectedMarathon);
      }
      return;
    }

    const formatted = formatPhoneNumber(val);
    setContactInput(formatted);

    const rawDigits = formatted.replace(/\D/g, "");
    if (rawDigits.length === 11 && selectedMarathon) {
      verifyStudent(formatted, false, selectedMarathon);
    } else {
      setStatus("idle");
      setFoundUser(null);
    }
  };

  const verifyStudent = async (value, isEmail, marathonId) => {
    setStatus("checking");
    try {
      if (onCheckStudent) {
        const result = await onCheckStudent(value, isEmail, marathonId);
        if (!result || result.status === "not_found") {
          setStatus("not_found");
          setFoundUser(null);
        } else if (result.status === "already_in_this_marathon") {
          setStatus("already_in_this_marathon");
          setFoundUser(result.student);
        } else if (result.status === "in_another_marathon") {
          setStatus("in_another_marathon");
          setFoundUser(result.student);
        } else {
          setStatus("found");
          setFoundUser(result.student);
        }
      } else {
        setStatus("found");
      }
    } catch {
      setStatus("not_found");
      setFoundUser(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMarathon) {
      alert("Сначала выберите марафон!");
      return;
    }

    if (status !== "found") {
      alert("Этого участника нельзя добавить!");
      return;
    }

    const trimmed = contactInput.trim();
    const isEmail = trimmed.includes("@");

    try {
      setIsSubmitting(true);
      await onAdd(selectedMarathon, {
        name: foundUser?.name || "",
        email: isEmail ? trimmed.toLowerCase() : foundUser?.email || null,
        phone: !isEmail ? trimmed : foundUser?.phone || "",
      });

      setContactInput("+7 (7");
      setSelectedMarathon("");
      setStatus("idle");
      setFoundUser(null);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Добавить участника</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-semibold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Марафон
            </label>
            <select
              value={selectedMarathon}
              onChange={(e) => {
                setSelectedMarathon(e.target.value);
                setContactInput("+7 (7");
                setStatus("idle");
              }}
              required
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all bg-white"
            >
              <option value="">Выберите марафон</option>
              {marathons?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Телефон или Email
            </label>
            <input
              type="text"
              placeholder="+7 (707) 900-35-67 или email@mail.kz"
              value={contactInput}
              onChange={handleInputChange}
              required
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
            />

            {status === "checking" && (
              <p className="mt-2 text-xs text-gray-500 animate-pulse">
                🔍 Проверка в базе данных...
              </p>
            )}

            {status === "found" && (
              <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span>✓</span> Участник найден {foundUser?.name ? `(${foundUser.name})` : ""} — готов к добавлению!
              </div>
            )}

            {status === "not_found" && (
              <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <span>✕</span> Участник не зарегистрирован на сайте
              </div>
            )}

            {status === "in_another_marathon" && (
              <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <span>⚠</span> Участник уже состоит в другом марафоне
              </div>
            )}

            {status === "already_in_this_marathon" && (
              <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <span>✕</span> Участник уже добавлен в этот марафон
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || status !== "found"}
            className="w-full rounded-2xl bg-purple-600 py-3.5 font-semibold text-white shadow-lg shadow-purple-200 transition-all hover:bg-purple-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? "Добавление..." : "Добавить"}
          </button>
        </form>
      </div>
    </div>
  );
}