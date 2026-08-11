"use client";

import React, { useEffect, useState } from "react";
import { Search, UserCheck, ExternalLink, Plus, Loader2, Phone, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import * as actions from "@/app/actions";
import LoadingState from "@/components/LoadingState";
import AddOrganizerModal from "@/components/AddOrganizerModal";

export default function OwnerOrganizersPage() {
  const router = useRouter();
  const { lang } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [organizers, setOrganizers] = useState([]);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState(null);

  // Смарт модаль және Тоаст хабарламалар
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  const loadData = async () => {
    const res = await actions.getAllOrganizersAction();
    if (res.ok) setOrganizers(res.organizers || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImpersonate = async (orgId) => {
    setActionId(orgId);
    const res = await actions.impersonateOrganizationAction(orgId);
    if (res.ok) {
      router.push(`/${lang}/org/admin?orgId=${orgId}`);
    } else {
      showToast("Қате: " + res.error, "error");
      setActionId(null);
    }
  };

  const handleCheckUser = async (contactValue, isEmail) => {
    return await actions.checkUserForOrganizerAction(contactValue, isEmail);
  };

  const handleAddOrganizer = async (data) => {
    const res = await actions.createOrganizerUserAction(data);
    if (res.ok) {
      showToast("Организатор сәтті бекітілді!", "success");
      await loadData();
    } else {
      showToast(res.error, "error");
    }
  };

  if (loading) return <LoadingState />;

  const filtered = organizers.filter(
    (o) =>
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.email?.toLowerCase().includes(search.toLowerCase()) ||
      o.phone?.includes(search)
  );

  return (
    <div className="space-y-6 w-full pb-12 font-sans text-slate-900 relative">
      {/* 🔔 ӘДЕМІ TOAST ХАБАРЛАМА */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl text-xs font-bold border transition-all animate-bounce ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Организаторлар
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Платформаны жалға алған B2B клиенттер (Организатор аккаунттары).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Аты, email, телефон..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md shadow-purple-200"
          >
            <Plus size={16} />
            Организатор Қосу
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Организатор</th>
                <th className="px-6 py-4">Байланыс Мәліметі</th>
                <th className="px-6 py-4 text-center">Марафондар</th>
                <th className="px-6 py-4 text-center">Оқушылар Саны</th>
                <th className="px-6 py-4 text-right">Кабинетіне Кіру</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    Организаторлар табылмады.
                  </td>
                </tr>
              ) : (
                filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl">
                        <UserCheck size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900">{org.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          ORGANIZER ROLE
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400" />
                        {org.email}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" />
                        {org.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl font-bold text-[11px]">
                        {org.marathonsCount} марафон
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[11px]">
                        {org.studentsCount} оқушы
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleImpersonate(org.id)}
                        disabled={actionId === org.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        {actionId === org.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ExternalLink className="w-3.5 h-3.5" />
                        )}
                        Кабинетке Кіру
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddOrganizerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCheckUser={handleCheckUser}
        onAddOrganizer={handleAddOrganizer}
      />
    </div>
  );
}