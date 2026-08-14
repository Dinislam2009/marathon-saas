"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, ShieldAlert, Loader2, XCircle } from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

export default function AddStudentPage() {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [contactInput, setContactInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [foundUser, setFoundUser] = useState(null);

  const [marathons, setMarathons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedMarathon, setSelectedMarathon] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PAID");

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    async function initData() {
      try {
        const orgId = typeof window !== "undefined" ? localStorage.getItem("current_org_id") : null;

        const getMarathonsFn = actions.getMarathonsByOrgId || actions.getMarathons;
        if (typeof getMarathonsFn === "function" && orgId) {
          const mList = await getMarathonsFn(orgId);
          setMarathons(mList || []);
        }

        const getGroupsFn = actions.getGroups || actions.getGroupsByOrgId;
        if (typeof getGroupsFn === "function" && orgId) {
          const gList = await getGroupsFn(orgId);
          setGroups(gList || []);
        } else if (orgId) {
          const res = await fetch(`/api/org/groups?orgId=${orgId}`);
          const json = await res.json();
          if (json.ok || Array.isArray(json.groups)) {
            setGroups(json.groups || []);
          }
        }
      } catch (err) {
        console.error("Data load error:", err);
      }
    }
    initData();
  }, []);

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

  const verifyStudent = async (value) => {
    if (!value) return;
    setStatus("checking");
    setSubmitError("");

    try {
      const isEmail = value.includes("@") || /[a-zA-Z]/.test(value);
      const checkFn = actions.checkStudentForMarathon || actions.checkStudent;

      if (typeof checkFn === "function") {
        const res = await checkFn(value.trim(), isEmail);

        if (res?.status === "not_found") {
          setStatus("not_found");
          setStatusMessage(res.message || (isRu ? "Пользователь не найден в системе!" : "Пайдаланушы базада табылмады!"));
          setFoundUser(null);
          return;
        }

        const u = res.user;

        if (res.status === "invalid_role") {
          setStatus("invalid_role");
          setStatusMessage(res.message);
          setFoundUser(u);
          return;
        }

        if (res.status === "already_in_marathon") {
          setStatus("already_in_marathon");
          setStatusMessage(res.message);
          setFoundUser(u);
          return;
        }

        setStatus("ready");
        setFoundUser(u);
      }
    } catch (err) {
      setStatus("not_found");
      setStatusMessage(err?.message || (isRu ? "Ошибка связи с сервером" : "Серверлік қате орын алды"));
      setFoundUser(null);
    }
  };

  const scheduleVerify = (value) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      verifyStudent(value);
    }, 300);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSuccess(false);
    setSubmitError("");

    if (!val.trim()) {
      setContactInput("");
      clearTimeout(debounceRef.current);
      setStatus("idle");
      setFoundUser(null);
      return;
    }

    const isEmail = val.includes("@") || /[a-zA-Z]/.test(val);
    const formattedVal = isEmail ? val : formatPhoneNumber(val);
    setContactInput(formattedVal);

    scheduleVerify(formattedVal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMarathon) {
      setSubmitError(isRu ? "Выберите марафон!" : "Марафонды таңдаңыз!");
      return;
    }

    if (status !== "ready" || !foundUser) return;

    setLoading(true);
    setSubmitError("");

    try {
      const managerId = typeof window !== "undefined" ? localStorage.getItem("current_user_id") : null;

      const payload = {
        marathonId: selectedMarathon,
        groupId: selectedGroup || null,
        userId: foundUser.id,
        name: foundUser.name,
        email: foundUser.email || "",
        phone: foundUser.phone || "",
        paymentStatus,
        executorRole: "MANAGER",
        managerId,
      };

      const addFn = actions.addStudentToMarathon || actions.addStudentToMarathon;
      if (typeof addFn === "function") {
        const res = await addFn(payload);
        if (res?.ok) {
          setSuccess(true);
          setContactInput("");
          setStatus("idle");
          setFoundUser(null);
          setSelectedMarathon("");
          setSelectedGroup("");
        } else {
          setSubmitError(res?.error || (isRu ? "Ошибка добавления" : "Қосу кезінде қате орын алды"));
        }
      }
    } catch (err) {
      console.error(err);
      setSubmitError(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const availableGroups = groups.filter((g) => {
    if (!selectedMarathon) return true;
    return !g.marathonId || String(g.marathonId) === String(selectedMarathon);
  });

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans text-slate-900 pb-12">
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-black rounded-full border border-purple-100 uppercase">
            {isRu ? "Быстрый ввод" : "Жылдам Тіркеу"}
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-2">
            {isRu ? "Быстрый ввод ученика" : "Оқушыны Жылдам Тіркеу"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isRu
              ? "Введите Email или телефон ученика для поиска в базе и зачисления."
              : "Базадан оқушыны іздеп, марафонға тіркеу үшін Email немесе телефонын жазыңыз."}
          </p>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{isRu ? "Ученик успешно зачислен в марафон!" : "Оқушы марафонға сәтті тіркелді!"}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              {isRu ? "EMAIL ИЛИ НОМЕР ТЕЛЕФОНА" : "EMAIL НЕМЕСЕ ТЕЛЕФОН НӨМІРІ"}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={isRu ? "email@mail.ru или +7 (7XX)..." : "email@mail.kz немесе +7 (7XX)..."}
                value={contactInput}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-semibold outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 bg-slate-50 transition"
              />
              {status === "checking" && (
                <Loader2 className="w-4 h-4 animate-spin text-purple-600 absolute right-4 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {status === "ready" && foundUser && (
              <div className="mt-3 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1.5 text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                  <span className="font-extrabold text-emerald-700 uppercase tracking-wider">
                    ✓ {isRu ? "НАЙДЕН В БАЗЕ (ГОТОВ К ДОБАВЛЕНИЮ)" : "БАЗАДАН ТАБЫЛДЫ (ҚОСУҒА ДАЙЫН)"}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase">
                    STUDENT
                  </span>
                </div>
                <p><span className="font-bold text-slate-600">{isRu ? "ФИО: " : "Аты-жөні: "}</span>{foundUser.name}</p>
                <p><span className="font-bold text-slate-600">Email: </span>{foundUser.email || "—"}</p>
                <p><span className="font-bold text-slate-600">{isRu ? "Телефон: " : "Телефоны: "}</span>{foundUser.phone || "—"}</p>
              </div>
            )}

            {status === "not_found" && (
              <div className="mt-3 p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-700 font-bold flex items-start gap-2.5 animate-in fade-in">
                <XCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>✕ {statusMessage}</span>
              </div>
            )}

            {status === "invalid_role" && (
              <div className="mt-3 p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-700 font-bold flex items-start gap-2.5 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>⛔ {statusMessage}</span>
              </div>
            )}

            {status === "already_in_marathon" && (
              <div className="mt-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 font-bold flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>⚠️ {statusMessage}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              {isRu ? "МАРАФОН" : "МАРАФОНДЫ ТАҢДАҢЫЗ"}
            </label>
            <select
              required
              value={selectedMarathon}
              onChange={(e) => {
                setSelectedMarathon(e.target.value);
                setSelectedGroup("");
              }}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none focus:border-purple-600 bg-slate-50 cursor-pointer"
            >
              <option value="">{isRu ? "-- Выберите марафон --" : "-- Марафонды таңдаңыз --"}</option>
              {marathons.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              {isRu ? "ГРУППА (ОПЦИОНАЛЬНО)" : "ТОП (МІНДЕТТІ ЕМЕС)"}
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none focus:border-purple-600 bg-slate-50 cursor-pointer"
            >
              <option value="">{isRu ? "-- Без группы --" : "-- Топсыз --"}</option>
              {availableGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              {isRu ? "СПОСОБ ОПЛАТЫ" : "ТӨЛЕМ ТӘСІЛІ"}
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none focus:border-purple-600 bg-slate-50 cursor-pointer"
            >
              <option value="PAID">{isRu ? "Оплачено (Полная сумма)" : "Төленді (Толық)"}</option>
              <option value="INSTALLMENT">{isRu ? "Рассрочка (Kaspi Red / Бөліп төлеу)" : "Бөліп төлеу (Рассрочка)"}</option>
              <option value="FREE">{isRu ? "Промо / Бесплатно" : "Тегін / Промо"}</option>
            </select>
          </div>

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || status !== "ready"}
            className="w-full rounded-2xl bg-purple-600 py-3.5 text-xs font-extrabold text-white shadow-md shadow-purple-200 hover:bg-purple-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer mt-2"
          >
            {loading ? (isRu ? "Зачисление..." : "Тіркелуде...") : (isRu ? "Зачислить ученика" : "Оқушыны Марафонға Тіркеу")}
          </button>
        </form>
      </div>
    </div>
  );
}