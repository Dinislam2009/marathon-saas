"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function AddStudentModal({ isOpen, onClose, marathons, onAdd, onCheckStudent }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [selectedMarathon, setSelectedMarathon] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [status, setStatus] = useState("idle");
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

  const scheduleVerify = (value, isEmail, marathonId) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      verifyStudent(value, isEmail, marathonId);
    }, 300);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;

    if (!val.trim()) {
      setContactInput("");
      clearTimeout(debounceRef.current);
      setStatus("idle");
      setFoundUser(null);
      return;
    }

    const isEmail = val.includes("@") || /[a-zA-Z]/.test(val);
    let formattedVal = val;

    if (!isEmail) {
      formattedVal = formatPhoneNumber(val);
    }

    setContactInput(formattedVal);

    if (!selectedMarathon) return;

    const rawDigits = formattedVal.replace(/\D/g, "");
    
    if ((isEmail && formattedVal.trim().length > 4) || rawDigits.length === 11) {
      scheduleVerify(formattedVal.trim(), isEmail, selectedMarathon);
    } else {
      clearTimeout(debounceRef.current);
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
        } else if (result.status === "found") {
          setStatus("found");
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
    if (!selectedMarathon || status !== "found") return;

    const trimmed = contactInput.trim();
    const isEmail = trimmed.includes("@");

    try {
      setIsSubmitting(true);
      await onAdd(selectedMarathon, {
        name: foundUser?.name || "",
        email: isEmail ? trimmed.toLowerCase() : foundUser?.email || null,
        phone: !isEmail ? trimmed : foundUser?.phone || "",
      });

      setContactInput("");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm font-sans text-slate-900">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isRu ? "Добавить участника" : "Қатысушы қосу"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isRu ? "Марафон" : "Марафон"}
            </label>
            <select
              value={selectedMarathon}
              onChange={(e) => {
                const mId = e.target.value;
                setSelectedMarathon(mId);
                setStatus("idle");
                setFoundUser(null);

                if (mId && contactInput.trim()) {
                  const isEmail = contactInput.includes("@");
                  scheduleVerify(contactInput.trim(), isEmail, mId);
                }
              }}
              required
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all bg-white"
            >
              <option value="">{isRu ? "Выберите марафон" : "Марафонды таңдаңыз"}</option>
              {marathons?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              {isRu ? "Email или номер телефона" : "Email немесе телефон нөмірі"}
            </label>

            <input
              type="text"
              placeholder={isRu ? "email@mail.kz или +7..." : "email@mail.kz немесе +7..."}
              value={contactInput}
              onChange={handleInputChange}
              required
              className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all text-sm"
            />

            {/* Статустар */}
            {status === "checking" && (
              <p className="mt-2 text-xs text-gray-500 animate-pulse">
                {isRu ? "🔍 Проверка в базе данных..." : "🔍 Деректер базасынан тексерілуде..."}
              </p>
            )}

            {/* Базадан табылды */}
            {status === "found" && (
              <div className="mt-2 text-sm font-medium text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                {isRu 
                  ? `✓ Пользователь найден в базе ${foundUser?.name ? `(${foundUser.name})` : ""} — готов к добавлению!` 
                  : `✓ Пайдаланушы базадан табылды ${foundUser?.name ? `(${foundUser.name})` : ""} — қосуға дайын!`}
              </div>
            )}

            {/* Базада жоқ */}
            {status === "not_found" && (
              <div className="mt-2 text-sm font-medium text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {isRu ? "✕ Участник не найден в базе данных" : "✕ Қатысушы деректер базасынан табылмады"}
              </div>
            )}

            {/* Басқа марафонда бар */}
            {status === "in_another_marathon" && (
              <div className="mt-2 text-sm font-medium text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                {isRu ? "⚠ Участник уже состоит в другом марафоне" : "⚠ Қатысушы басқа марафонда бар"}
              </div>
            )}

            {/* Тура осы марафонда бар */}
            {status === "already_in_this_marathon" && (
              <div className="mt-2 text-sm font-medium text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {isRu ? "✕ Пользователь уже добавлен в этот марафон" : "✕ Пайдаланушы бұл марафонға қосылып қойған"}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || status !== "found"}
            className="w-full rounded-2xl bg-purple-600 py-3.5 font-semibold text-white shadow-lg shadow-purple-200 transition-all hover:bg-purple-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
          >
            {isSubmitting 
              ? (isRu ? "Добавление..." : "Қосылуда...") 
              : (isRu ? "Добавить" : "Қосу")}
          </button>
        </form>
      </div>
    </div>
  );
}