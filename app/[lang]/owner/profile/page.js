"use client";

import React, { useState, useEffect } from "react";
import { User, Key, ShieldCheck, Save, Loader2, CheckCircle2 } from "lucide-react";
import * as actions from "@/app/actions";
import LoadingState from "@/components/LoadingState";

export default function OwnerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const res = await actions.getOwnerProfile();
      
      if (res.ok && res.profile) {
        setUserId(res.profile.userId || "");
        setName(res.profile.name || "");
        setEmail(res.profile.email || "");
        setPhone(res.profile.phone || "");
      } else {
        console.error("Профиль жүктелмеді:", res.error);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const res = await actions.updateOwnerProfileAction(userId, {
      name,
      email,
      phone,
      currentPassword,
      newPassword,
    });

    if (res.ok) {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setSuccess(false), 4000);
    } else {
      alert("Қате: " + res.error);
    }
    setSaving(false);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 w-full pb-12 font-sans text-slate-900 max-w-4xl">
      {/* HEADER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Профиль баптаулары
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Super Admin аккаунтының жеке мәліметтері мен қауіпсіздік параметрлері.
          </p>
        </div>
        <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
          <ShieldCheck size={28} />
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={18} />
            Деректер базада сәтті жаңартылды!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. БАЙЛАНЫС ДЕРЕКТЕРІ */}
          <div>
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <User size={18} className="text-purple-600" />
              Жеке мәліметтер
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Аты-жөні
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 transition"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Телефон нөмірі
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 transition"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 2. ҚАУІПСІЗДІК ЖӘНЕ ҚҰПИЯ СӨЗ */}
          <div>
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <Key size={18} className="text-purple-600" />
              Құпия сөзді өзгерту
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Қазіргі құпия сөз
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 transition"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Жаңа құпия сөз
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 transition"
                />
              </div>
            </div>
          </div>

          {/* BUTTON */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              Өзгерістерді Сақтау
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}