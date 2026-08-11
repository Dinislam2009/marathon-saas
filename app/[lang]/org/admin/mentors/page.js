"use client";

import { use, useEffect, useState, useRef } from "react";
import { UserPlus, Trash2, Settings, ShieldAlert, X } from "lucide-react";
import { useData } from "@/context/DataContext";
import Card from "@/components/Card";
import Button from "@/components/Button";
import LoadingState from "@/components/LoadingState";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

// --- 1. кураторДЫ ҚОСУ МОДАЛЬ ТЕРЕЗЕСІ ---
function AddcuratorModal({ isOpen, onClose, marathons, onAdd, onCheckcurator, isRu }) {
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
      verifycurator(value, isEmail, marathonId);
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

  const verifycurator = async (value, isEmail, marathonId) => {
    setStatus("checking");
    try {
      if (onCheckcurator) {
        const result = await onCheckcurator(value, isEmail, marathonId);
        if (!result || result.status === "not_found") {
          setStatus("not_found");
          setFoundUser(null);
        } else if (result.status === "already_in_this_marathon") {
          setStatus("already_in_this_marathon");
          setFoundUser(result.curator || result.user);
        } else {
          setStatus("found");
          setFoundUser(result.curator || result.user);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isRu ? "Добавить куратора" : "куратор қосу"}
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
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all bg-white text-sm cursor-pointer"
            >
              <option value="">
                {isRu ? "Выберите марафон" : "Марафонды таңдаңыз"}
              </option>
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
              placeholder={isRu ? "email@mail.ru или +7..." : "email@mail.kz немесе +7..."}
              value={contactInput}
              onChange={handleInputChange}
              required
              className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all text-sm"
            />

            {status === "checking" && (
              <p className="mt-2 text-xs text-gray-500 animate-pulse">
                🔍 {isRu ? "Проверка в базе данных..." : "Деректер базасынан тексерілуде..."}
              </p>
            )}

            {status === "found" && (
              <div className="mt-2 text-sm font-medium text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                ✓ {isRu ? "куратор найден в базе" : "куратор базадан табылды"} {foundUser?.name ? `(${foundUser.name})` : ""} — {isRu ? "готов к добавлению!" : "қосуға дайын!"}
              </div>
            )}

            {status === "not_found" && (
              <div className="mt-2 text-sm font-medium text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                ✕ {isRu ? "куратор не найден в базе данных" : "куратор деректер базасынан табылмады"}
              </div>
            )}

            {status === "already_in_this_marathon" && (
              <div className="mt-2 text-sm font-medium text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                ✕ {isRu ? "куратор уже добавлен в этот марафон" : "куратор бұл марафонға қосылып қойған"}
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

// --- 2. кураторҒА МАРАФОН БЕКІТУ МОДАЛЬ ТЕРЕЗЕСІ ---
function ManageAccessModal({ isOpen, onClose, curator, allMarathons, onSave, isRu }) {
  const [selectedMarathonId, setSelectedMarathonId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (curator) {
      const currentId =
        curator.marathonId ||
        curator.marathon?.id ||
        curator.marathons?.[0]?.id ||
        curator.students?.[0]?.marathonId ||
        "";
      setSelectedMarathonId(currentId);
    }
  }, [curator]);

  if (!isOpen || !curator) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSave(curator.id, selectedMarathonId);
      onClose();
    } catch (err) {
      console.error("Failed to save curator access:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isRu ? "Привязать марафон" : "Марафонды бекіту"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isRu ? "куратор: " : "куратор: "}
              <span className="font-semibold text-gray-800">{curator.name || curator.fullName}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isRu ? "Выберите марафон (1 куратор = 1 марафон)" : "Марафонды таңдаңыз (1 куратор = 1 марафон)"}
            </label>
            <select
              value={selectedMarathonId}
              onChange={(e) => setSelectedMarathonId(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all bg-white text-sm cursor-pointer"
            >
              <option value="">
                {isRu ? "Не привязан ни к какому марафону" : "Ешқандай марафонға бекітілмеген"}
              </option>
              {allMarathons?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSaving}>
              {isRu ? "Отмена" : "Бас тарту"}
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
              {isSaving
                ? (isRu ? "Сохранение..." : "Сақталуда...")
                : (isRu ? "Сохранить" : "Сақтау")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- 3. кураторДЫ ӨШІРУДІ РАСТАУ МОДАЛЬ ТЕРЕЗЕСІ ---
function DeleteConfirmModal({ isOpen, onClose, curator, onDelete, isRu }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !curator) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(curator.id);
      onClose();
    } catch (err) {
      console.error("Failed to delete curator:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm font-sans">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={24} />
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {isRu ? "Удалить куратора?" : "кураторды өшіру?"}
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          {isRu ? "Вы уверены, что хотите удалить куратора " : "Сенімдісіз бе, кураторды өшіру "}{" "}
          <span className="font-semibold text-gray-800">{curator.name || curator.fullName}</span>?{" "}
          {isRu ? "Это действие нельзя отменить." : "Бұл әрекетті қайтару мүмкін емес."}
        </p>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting} className="w-1/2">
            {isRu ? "Отмена" : "Бас тарту"}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isDeleting
              ? (isRu ? "Удаление..." : "Өшірілуде...")
              : (isRu ? "Удалить" : "Өшіру")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- 4. НЕГІЗГІ БЕТ КОМПОНЕНТІ ---
export default function curatorsPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const { orgId } = use(params);
  const { ready, tick, triggerUpdate } = useData();

  const [curators, setcurators] = useState([]);
  const [marathons, setMarathons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Модаль терезелер күйі
  const [inviteOpen, setInviteOpen] = useState(false);
  const [accessModalcurator, setAccessModalcurator] = useState(null);
  const [deleteModalcurator, setDeleteModalcurator] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (typeof actions.getcuratorsByOrgId === "function") {
        const res = await actions.getcuratorsByOrgId(orgId);
        const rawList = res || [];

        // ⚡ ДУБЛИКАТТАРДЫ ТАЗАЛАУ (email немесе name/phone бойынша уникалды қылу)
        const uniqueList = Array.from(
          new Map(
            rawList.map((m) => [
              (m.email || m.phone || m.name || m.id).toLowerCase(),
              m,
            ])
          ).values()
        );

        setcurators(uniqueList);
      }
      if (typeof actions.getMarathonsByOrgId === "function") {
        const mRes = await actions.getMarathonsByOrgId(orgId);
        setMarathons(mRes || []);
      }
    } catch (err) {
      console.error("Failed to load curators page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      fetchData();
    }
  }, [ready, orgId, tick]);

  const handleAddcurator = async (marathonId, curatorData) => {
    if (typeof actions.addcurator === "function") {
      await actions.addcurator({
        orgId,
        marathonId,
        ...curatorData,
      });
      fetchData();
      if (triggerUpdate) triggerUpdate();
    }
  };

  const handleCheckcurator = async (value, isEmail, marathonId) => {
    if (typeof actions.checkcurator === "function") {
      return await actions.checkcurator(value, isEmail, marathonId);
    }
    return { status: "found" };
  };

  const handleSaveAccess = async (curatorId, marathonId) => {
    if (typeof actions.updatecuratorMarathons === "function") {
      await actions.updatecuratorMarathons(curatorId, marathonId);
      fetchData();
      if (triggerUpdate) triggerUpdate();
    }
  };

  const handleDeletecurator = async (curatorId) => {
    if (typeof actions.deletecurator === "function") {
      await actions.deletecurator(curatorId);
      fetchData();
      if (triggerUpdate) triggerUpdate();
    }
  };

  if (!ready || loading) return <LoadingState />;

  return (
    <div key={tick} className="flex flex-col gap-6 font-sans text-slate-900 pb-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-900">
            {isRu ? "Кураторы" : "Кураторлар"}
          </h1>
          <p className="text-xs text-mist mt-1">
            {isRu ? "Список всех кураторов организации" : "Ұйымдағы барлық Кураторлар тізімі"}
          </p>
        </div>

        <Button onClick={() => setInviteOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer">
          <UserPlus size={16} /> {isRu ? "Добавить куратора" : "куратор қосу"}
        </Button>
      </div>

      <Card padded={false} className="overflow-hidden bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <table className="w-full text-sm text-left text-slate-900">
          <thead className="bg-slate-50/50 text-xs uppercase text-slate-400 font-bold border-b border-slate-100">
            <tr>
              <th className="p-4">{isRu ? "куратор" : "куратор"}</th>
              <th className="p-4">{isRu ? "EMAIL" : "EMAIL"}</th>
              <th className="p-4">{isRu ? "ТЕЛЕФОН" : "ТЕЛЕФОН"}</th>
              <th className="p-4">{isRu ? "МАРАФОН" : "МАРАФОН"}</th>
              <th className="p-4">{isRu ? "КОЛ-ВО УЧЕНИКОВ" : "ОҚУШЫ САНЫ"}</th>
              <th className="p-4 text-right">{isRu ? "ДЕЙСТВИЯ" : "ӘРЕКЕТТЕР"}</th>
            </tr>
          </thead>
          <tbody>
            {curators.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                  {isRu ? "Кураторы пока не добавлены." : "Әзірге Кураторлар қосылмаған."}
                </td>
              </tr>
            ) : (
              curators.map((curator, index) => {
                const assignedMarathon =
                  curator.marathons?.[0]?.title ||
                  curator.students?.[0]?.marathon?.title ||
                  curator.marathonTitle;

                return (
                  <tr
                    key={curator.id || `curator-${index}`}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-900">{curator.name || curator.fullName || (isRu ? "Без имени" : "Аты жоқ")}</td>
                    <td className="p-4 text-slate-500 font-medium">{curator.email || "—"}</td>
                    <td className="p-4 text-slate-500 font-medium">{curator.phone || "—"}</td>
                    <td className="p-4">
                      {assignedMarathon ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {assignedMarathon}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {isRu ? "Не привязан" : "Бекітілмеген"}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {curator._count?.students || curator.studentsCount || 0}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setAccessModalcurator(curator)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                          title={isRu ? "Привязать марафон" : "Марафонды бекіту"}
                        >
                          <Settings size={14} className="text-slate-500" />
                          {isRu ? "Доступ" : "Рұқсат"}
                        </button>

                        <button
                          onClick={() => setDeleteModalcurator(curator)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title={isRu ? "Удалить куратора" : "кураторды өшіру"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      <AddcuratorModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        marathons={marathons}
        onAdd={handleAddcurator}
        onCheckcurator={handleCheckcurator}
        isRu={isRu}
      />

      <ManageAccessModal
        isOpen={Boolean(accessModalcurator)}
        onClose={() => setAccessModalcurator(null)}
        curator={accessModalcurator}
        allMarathons={marathons}
        onSave={handleSaveAccess}
        isRu={isRu}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteModalcurator)}
        onClose={() => setDeleteModalcurator(null)}
        curator={deleteModalcurator}
        onDelete={handleDeletecurator}
        isRu={isRu}
      />
    </div>
  );
}