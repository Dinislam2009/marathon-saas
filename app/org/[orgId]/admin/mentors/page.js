"use client";

import { use, useEffect, useState, useRef } from "react";
import { UserPlus } from "lucide-react";
import { useData } from "@/context/DataContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import * as actions from "@/app/actions";

function AddMentorModal({ isOpen, onClose, marathons, onAdd, onCheckMentor }) {
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
      verifyMentor(value, isEmail, marathonId);
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

  const verifyMentor = async (value, isEmail, marathonId) => {
    setStatus("checking");
    try {
      if (onCheckMentor) {
        const result = await onCheckMentor(value, isEmail, marathonId);
        if (!result || result.status === "not_found") {
          setStatus("not_found");
          setFoundUser(null);
        } else if (result.status === "already_in_this_marathon") {
          setStatus("already_in_this_marathon");
          setFoundUser(result.mentor || result.user);
        } else if (result.status === "found") {
          setStatus("found");
          setFoundUser(result.mentor || result.user);
        } else {
          setStatus("found");
          setFoundUser(result.mentor || result.user);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Добавить ментора</h2>
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
              <option value="">Выберите марафон</option>
              {marathons?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              Email или номер телефона
            </label>

            <input
              type="text"
              placeholder="email@mail.kz или +7..."
              value={contactInput}
              onChange={handleInputChange}
              required
              className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all text-sm"
            />

            {status === "checking" && (
              <p className="mt-2 text-xs text-gray-500 animate-pulse">
                🔍 Проверка в базе данных...
              </p>
            )}

            {status === "found" && (
              <div className="mt-2 text-sm font-medium text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                ✓ Ментор найден в базе {foundUser?.name ? `(${foundUser.name})` : ""} — готов к добавлению!
              </div>
            )}

            {status === "not_found" && (
              <div className="mt-2 text-sm font-medium text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                ✕ Ментор не найден в базе данных
              </div>
            )}

            {status === "already_in_this_marathon" && (
              <div className="mt-2 text-sm font-medium text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                ✕ Ментор уже добавлен в этот марафон
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

export default function MentorsPage({ params }) {
  const { orgId } = use(params);
  const { ready, tick, triggerUpdate } = useData();

  const [mentors, setMentors] = useState([]);
  const [marathons, setMarathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (typeof actions.getMentorsByOrgId === "function") {
        const res = await actions.getMentorsByOrgId(orgId);
        setMentors(res || []);
      }
      if (typeof actions.getMarathonsByOrgId === "function") {
        const mRes = await actions.getMarathonsByOrgId(orgId);
        setMarathons(mRes || []);
      }
    } catch (err) {
      console.error("Failed to load mentors page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      fetchData();
    }
  }, [ready, orgId, tick]);

  const handleAddMentor = async (marathonId, mentorData) => {
    if (typeof actions.addMentor === "function") {
      await actions.addMentor({
        orgId,
        marathonId,
        ...mentorData,
      });
      fetchData();
      if (triggerUpdate) triggerUpdate();
    }
  };

  const handleCheckMentor = async (value, isEmail, marathonId) => {
    if (typeof actions.checkMentor === "function") {
      return await actions.checkMentor(value, isEmail, marathonId);
    }
    return { status: "found" };
  };

  if (!ready || loading) return <LoadingState />;

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Менторы
          </h1>
          <p className="text-xs text-mist mt-1">
            Список всех менторов организации
          </p>
        </div>

        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus size={16} /> Добавить ментора
        </Button>
      </div>

      <Card padded={false} className="overflow-hidden bg-white border border-mist-light rounded-2xl">
        <table className="w-full text-sm text-left text-ink">
          <thead className="bg-mist-light/30 text-xs uppercase text-mist font-semibold">
            <tr>
              <th className="p-4">МЕНТОР</th>
              <th className="p-4">EMAIL</th>
              <th className="p-4">ТЕЛЕФОН</th>
              <th className="p-4">КОЛ-ВО УЧЕНИКОВ</th>
            </tr>
          </thead>
          <tbody>
            {mentors.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-mist">
                  Менторы пока не добавлены.
                </td>
              </tr>
            ) : (
              mentors.map((mentor, index) => (
                <tr
                  key={mentor.id || `mentor-${index}`}
                  className="border-b border-mist-light last:border-0 hover:bg-paper-dim/10 transition-colors"
                >
                  <td className="p-4 font-medium">{mentor.name || mentor.fullName || "Без имени"}</td>
                  <td className="p-4 text-mist">{mentor.email || "—"}</td>
                  <td className="p-4 text-mist">{mentor.phone || "—"}</td>
                  <td className="p-4 font-medium">
                    {mentor._count?.students || mentor.studentsCount || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <AddMentorModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        marathons={marathons}
        onAdd={handleAddMentor}
        onCheckMentor={handleCheckMentor}
      />
    </div>
  );
}