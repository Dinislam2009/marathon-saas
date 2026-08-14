"use client";

import { use, useEffect, useState, useRef } from "react";
import { UserPlus, Trash2, Settings, ShieldAlert, X } from "lucide-react";
import { useData } from "@/context/DataContext";
import Card from "@/components/Card";
import Button from "@/components/Button";
import LoadingState from "@/components/LoadingState";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

// --- 1. КУРАТОРДЫ ҚОСУ МОДАЛЬ ТЕРЕЗЕСІ ---
function AddCuratorModal({ isOpen, onClose, marathons, onAdd, onCheckCurator, isRu }) {
  const [selectedMarathon, setSelectedMarathon] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [status, setStatus] = useState("idle");
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

  const scheduleVerify = (value, isEmail, marathonId) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      verifyCurator(value, isEmail, marathonId);
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

    if (!selectedMarathon) return;

    const rawDigits = formattedVal.replace(/\D/g, "");

    if ((isEmail && formattedVal.trim().length > 4) || rawDigits.length === 11) {
      scheduleVerify(formattedVal.trim(), isEmail, selectedMarathon);
    } else {
      clearTimeout(debounceRef.current);
      setStatus("idle");
      setStatusMessage("");
      setFoundUser(null);
    }
  };

  const verifyCurator = async (value, isEmail, marathonId) => {
    setStatus("checking");
    try {
      if (onCheckCurator) {
        const result = await onCheckCurator(value, isEmail, marathonId);
        const user = result?.curator || result?.user;

        if (!result || result.status === "not_found" || !user) {
          setStatus("not_found");
          setFoundUser(null);
          return;
        }

        if (user.role === "OWNER" || user.role === "ORGANIZER") {
          setStatus("invalid_role");
          setStatusMessage(
            isRu
              ? "Нельзя добавить Администратора или Организатора в качестве куратора."
              : "Әкімшіні немесе Организаторды куратор етіп тағайындауға болмайды."
          );
          setFoundUser(user);
          return;
        }

        if (result.status === "already_in_this_marathon") {
          setStatus("already_in_this_marathon");
          setStatusMessage(
            isRu
              ? "Куратор уже добавлен в этот марафон."
              : "Куратор бұл марафонға бұрыннан қосылған."
          );
          setFoundUser(user);
          return;
        }

        setStatus("ready");
        setFoundUser(user);
      } else {
        setStatus("ready");
      }
    } catch {
      setStatus("not_found");
      setFoundUser(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMarathon || status !== "ready") return;

    try {
      setIsSubmitting(true);
      await onAdd(selectedMarathon, {
        userId: foundUser?.id,
      });

      setContactInput("");
      setSelectedMarathon("");
      setStatus("idle");
      setStatusMessage("");
      setFoundUser(null);
      onClose();
    } catch (err) {
      console.error("Add curator error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserDisplayName = (u) => {
    if (!u) return "—";
    if (u.name) return u.name;
    if (u.firstName || u.lastName) return `${u.firstName || ""} ${u.lastName || ""}`.trim();
    return u.email || u.phone || "—";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs font-sans p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-gray-900">
            {isRu ? "Добавить куратора" : "Куратор қосу"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              {isRu ? "ВЫБЕРИТЕ МАРАФОН" : "МАРАФОНДЫ ТАҢДАҢЫЗ"}
            </label>
            <select
              value={selectedMarathon}
              onChange={(e) => {
                const mId = e.target.value;
                setSelectedMarathon(mId);
                setStatus("idle");
                setStatusMessage("");
                setFoundUser(null);

                if (mId && contactInput.trim()) {
                  const isEmail = contactInput.includes("@");
                  scheduleVerify(contactInput.trim(), isEmail, mId);
                }
              }}
              required
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all bg-gray-50 text-xs font-semibold cursor-pointer"
            >
              <option value="">
                {isRu ? "-- Выберите марафон --" : "-- Марафонды таңдау --"}
              </option>
              {marathons?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              {isRu ? "EMAIL ИЛИ НОМЕР ТЕЛЕФОНА" : "EMAIL НЕМЕСЕ ТЕЛЕФОН НӨМІРІ"}
            </label>

            <input
              type="text"
              placeholder={isRu ? "email@mail.ru или +7 (7XX)..." : "email@mail.kz немесе +7 (7XX)..."}
              value={contactInput}
              onChange={handleInputChange}
              required
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all text-xs font-medium bg-gray-50"
            />

            {status === "checking" && (
              <div className="mt-3 p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-600 font-medium animate-pulse">
                🔍 {isRu ? "Проверка данных в базе..." : "Базадан деректер тексерілуде..."}
              </div>
            )}

            {status === "ready" && foundUser && (
              <div className="mt-3 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
                    ✓ {isRu ? "ГОТОВО К ДОБАВЛЕНИЮ!" : "ҚОСУҒА ДАЙЫН!"}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-extrabold uppercase">
                    {foundUser.role === "PARTICIPANT"
                      ? (isRu ? "Ученик" : "Оқушы")
                      : (isRu ? "Пользователь" : "Пайдаланушы")}
                  </span>
                </div>
                <div className="text-xs space-y-1 text-emerald-950 font-medium">
                  <p>
                    <span className="text-emerald-700 font-bold">{isRu ? "ФИО: " : "Аты-жөні: "}</span>
                    {getUserDisplayName(foundUser)}
                  </p>
                  <p>
                    <span className="text-emerald-700 font-bold">{isRu ? "Почта: " : "Поштасы: "}</span>
                    {foundUser.email || "—"}
                  </p>
                  <p>
                    <span className="text-emerald-700 font-bold">{isRu ? "Телефон: " : "Телефоны: "}</span>
                    {foundUser.phone || "—"}
                  </p>
                </div>
              </div>
            )}

            {status === "invalid_role" && (
              <div className="mt-3 p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-700 space-y-1">
                <p className="font-bold">⛔ {statusMessage}</p>
              </div>
            )}

            {status === "already_in_this_marathon" && (
              <div className="mt-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <p className="font-bold">⚠️ {statusMessage}</p>
              </div>
            )}

            {status === "not_found" && (
              <div className="mt-3 p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-700 font-medium">
                ✕ {isRu ? "Пользователь не найден в базе данных (Не зарегистрирован)." : "Пайдаланушы деректер базасынан табылмады (Тіркелмеген)."}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || status !== "ready"}
            className="w-full rounded-2xl bg-purple-600 py-3.5 font-extrabold text-xs text-white shadow-md shadow-purple-200 transition-all hover:bg-purple-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-3 cursor-pointer"
          >
            {isSubmitting
              ? (isRu ? "Добавление..." : "Қосылуда...")
              : (isRu ? "Добавить в марафон" : "Марафонға қосу")}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- 2. МАРАФОН БЕКІТУ МОДАЛІ ---
function ManageAccessModal({ isOpen, onClose, curator, allMarathons, onSave, isRu }) {
  const [selectedMarathonId, setSelectedMarathonId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (curator) {
      const currentId = curator.marathons?.[0]?.id || "";
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

  const curatorName = curator.name || `${curator.firstName || ""} ${curator.lastName || ""}`.trim() || curator.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs font-sans p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {isRu ? "Привязать марафон" : "Марафонды бекіту"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Куратор: <span className="font-bold text-gray-800">{curatorName}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">
              {isRu ? "Выберите марафон" : "Марафонды таңдаңыз"}
            </label>
            <select
              value={selectedMarathonId}
              onChange={(e) => setSelectedMarathonId(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-800 outline-none focus:border-purple-600 transition bg-gray-50 text-xs font-semibold cursor-pointer"
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
            <Button type="submit" disabled={isSaving} className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
              {isSaving ? (isRu ? "Сохранение..." : "Сақталуда...") : (isRu ? "Сохранить" : "Сақтау")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- 3. КУРАТОРДЫ ӨШІРУ МОДАЛІ ---
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

  const curatorName = curator.name || `${curator.firstName || ""} ${curator.lastName || ""}`.trim() || curator.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs font-sans p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={24} />
        </div>

        <h3 className="text-lg font-black text-gray-900 mb-1">
          {isRu ? "Удалить куратора?" : "Кураторды өшіру?"}
        </h3>
        <p className="text-xs text-gray-500 mb-6 font-medium">
          {isRu ? "Вы уверены, что хотите удалить куратора " : "Сенімдісіз бе, кураторды өшіру "}{" "}
          <span className="font-bold text-gray-800">{curatorName}</span>?
        </p>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting} className="w-1/2">
            {isRu ? "Отмена" : "Бас тарту"}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-bold"
          >
            {isDeleting ? (isRu ? "Удаление..." : "Өшірілуде...") : (isRu ? "Удалить" : "Өшіру")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- 4. НЕГІЗГІ БЕТ КОМПОНЕНТІ ---
export default function CuratorsPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const orgId = resolvedParams?.orgId;

  const { ready, tick, triggerUpdate } = useData();

  const [curators, setCurators] = useState([]);
  const [marathons, setMarathons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [accessModalcurator, setAccessModalcurator] = useState(null);
  const [deleteModalcurator, setDeleteModalcurator] = useState(null);

  const fetchData = async () => {
    if (!orgId) return;
    try {
      setLoading(true);

      if (typeof actions.getCuratorsByOrgId === "function") {
        const res = await actions.getCuratorsByOrgId(orgId);
        setCurators(res || []);
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

  const handleAddCurator = async (marathonId, curatorData) => {
    if (typeof actions.addCurator === "function") {
      await actions.addCurator({
        orgId,
        marathonId,
        ...curatorData,
      });
      await fetchData();
      if (triggerUpdate) triggerUpdate();
    }
  };

  const handleCheckCurator = async (value, isEmail, marathonId) => {
    if (typeof actions.checkCurator === "function") {
      return await actions.checkCurator(value, isEmail, marathonId);
    }
    return { status: "ready" };
  };

  const handleSaveAccess = async (curatorId, marathonId) => {
    if (typeof actions.updateCuratorMarathons === "function") {
      await actions.updateCuratorMarathons(curatorId, marathonId);
      await fetchData();
      if (triggerUpdate) triggerUpdate();
    }
  };

  const handleDeleteCurator = async (curatorId) => {
    if (typeof actions.deleteCurator === "function") {
      await actions.deleteCurator(curatorId);
      await fetchData();
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
          <p className="text-xs text-slate-500 mt-1">
            {isRu ? "Список всех кураторов организации" : "Ұйымдағы барлық Кураторлар тізімі"}
          </p>
        </div>

        <Button onClick={() => setInviteOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer font-bold">
          <UserPlus size={16} /> {isRu ? "Добавить куратора" : "Куратор қосу"}
        </Button>
      </div>

      <Card padded={false} className="overflow-hidden bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <table className="w-full text-sm text-left text-slate-900">
          <thead className="bg-slate-50/50 text-xs uppercase text-slate-400 font-bold border-b border-slate-100">
            <tr>
              <th className="p-4">{isRu ? "КУРАТОР" : "КУРАТОР"}</th>
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
                const assignedMarathon = curator.marathons?.[0]?.title;
                const studentCount = curator._count?.students || 0;
                const displayName = curator.name || `${curator.firstName || ""} ${curator.lastName || ""}`.trim() || (isRu ? "Без имени" : "Аты жоқ");

                return (
                  <tr
                    key={curator.id || `curator-${index}`}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-900">{displayName}</td>
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
                      {studentCount} {isRu ? "учеников" : "оқушы"}
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
                          title={isRu ? "Удалить куратора" : "Кураторды өшіру"}
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

      <AddCuratorModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        marathons={marathons}
        onAdd={handleAddCurator}
        onCheckCurator={handleCheckCurator}
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
        onDelete={handleDeleteCurator}
        isRu={isRu}
      />
    </div>
  );
}