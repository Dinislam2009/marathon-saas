"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronRight, 
  CreditCard, 
  Edit3, 
  Youtube, 
  Send, 
  LogOut 
} from "lucide-react";
import { useData } from "@/context/DataContext";
import Card from "@/components/ui/Card";
import LoadingState from "@/components/ui/LoadingState";

import { logoutAction, getProfileDataAction } from "@/app/actions";

// Instagram иконкасы Build қате бермес үшін осылай SVG болып жасалды
const InstagramIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default function ProfilePage({ params }) {
  const { orgId } = use(params);
  const router = useRouter();
  const { ready, currentStudentId, setCurrentStudentId } = useData();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfileData() {
      if (!ready) return;
      
      setLoading(true);
      try {
        if (currentStudentId) {
          const res = await getProfileDataAction(currentStudentId, orgId);
          if (res && res.ok) {
            setProfileData(res.data);
          }
        }
      } catch (err) {
        console.error("Профиль дерегін алуда қате:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, [ready, currentStudentId, orgId]);

  async function handleLogout() {
    await logoutAction();
    localStorage.removeItem("current_user_id");
    router.push("/login");
  }

  // Тек ready дайын болмаса немесе жұмыс жүріп жатса ғана Loading шығарамыз
  if (!ready || loading) return <LoadingState />;

  const { student, authUser, students = [] } = profileData || {};

  // Деректер болса соны, болмаса әдепкі мәндерді көрсетеміз (бет қатып қалмауы үшін)
  const studentName = student?.name || authUser?.firstName || "Дінислам Жұмамуратов";
  const studentEmail = authUser?.email || "dinislamjumamuratov18@gmail.com";
  const studentId = student?.id ? `ID${String(student.id).slice(0, 8).toUpperCase()}` : "JUZ40 ID251040147";
  const grade = student?.grade || "10";
  const subject1 = student?.subject1 || "Информатика";
  const subject2 = student?.subject2 || "Математика";
  const phone = authUser?.phone || student?.phone || "+7 707 900 35 65";

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 py-4">
      
      {/* 1. БАСТЫ ИНФО КАРТОЧКАСЫ (Суреттегідей) */}
      <Card className="!p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-start justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl shrink-0">
              {studentName.charAt(0)}
            </div>
            
            <div>
              <h1 className="text-xl font-bold text-slate-900">{studentName}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{studentEmail}</p>
              
              <div className="inline-block mt-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold rounded-full">
                {studentId}
              </div>
            </div>
          </div>

          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <Edit3 size={20} />
          </button>
        </div>

        {/* 4 Бағандық ақпарат панелі */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 text-sm">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Оқу сыныбы</p>
            <p className="font-bold text-slate-800">{grade}</p>
          </div>
          <div className="md:border-l md:border-slate-100 md:pl-4">
            <p className="text-xs text-slate-400 font-medium mb-1">1-ші пән</p>
            <p className="font-bold text-slate-800">{subject1}</p>
          </div>
          <div className="md:border-l md:border-slate-100 md:pl-4">
            <p className="text-xs text-slate-400 font-medium mb-1">2-ші пән</p>
            <p className="font-bold text-slate-800">{subject2}</p>
          </div>
          <div className="md:border-l md:border-slate-100 md:pl-4">
            <p className="text-xs text-slate-400 font-medium mb-1">Телефон нөмері (WhatsApp)</p>
            <p className="font-bold text-slate-800">{phone}</p>
          </div>
        </div>
      </Card>

      {/* Рөл ауыстыру селекторы (Dev үшін) */}
      {students.length > 0 && (
        <Card className="bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-400 font-medium uppercase mb-2">
            Қатысушыны таңдау (Тест режимі)
          </p>
          <select
            value={currentStudentId || ""}
            onChange={(e) => setCurrentStudentId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm bg-white"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Card>
      )}

      {/* 2. ЕРЕЖЕЛЕР МЕН FAQ */}
      <Card className="!p-0 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
        <a href="#" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
          <span className="text-sm font-medium text-slate-800">Ережелер мен келісімдер</span>
          <ChevronRight size={18} className="text-slate-400" />
        </a>
        <a href="#" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
          <span className="text-sm font-medium text-slate-800">FAQ</span>
          <ChevronRight size={18} className="text-slate-400" />
        </a>
      </Card>

      {/* 3. ТӨЛЕМ ТАРИХЫ */}
      <Card className="!p-0 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <a href="#" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <CreditCard size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-800">Төлем тарихы</span>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </a>
      </Card>

      {/* 4. БІЗ ӘЛЕУМЕТТІК ЖЕЛІЛЕРДЕ */}
      <Card className="!p-5 bg-white rounded-3xl shadow-sm border border-slate-100">
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">
          БІЗ ӘЛЕУМЕТТІК ЖЕЛІЛЕРДЕ
        </p>

        <div className="flex flex-col gap-3">
          <a href="#" className="flex items-center gap-3 text-slate-800 font-medium text-sm hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
              <Youtube size={16} />
            </div>
            <span>Бізді YouTube-тен қараңыз</span>
          </a>

          <a href="#" className="flex items-center gap-3 text-slate-800 font-medium text-sm hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
              <Send size={14} className="-ml-0.5" />
            </div>
            <span>Біздің Telegram арнамыз</span>
          </a>

          <a href="#" className="flex items-center gap-3 text-slate-800 font-medium text-sm hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0">
              <InstagramIcon />
            </div>
            <span>Біз Instagram - дамыз</span>
          </a>

          <a href="#" className="flex items-center gap-3 text-slate-800 font-medium text-sm hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shrink-0 font-bold text-xs">
              🎵
            </div>
            <span>Біздің TikTok</span>
          </a>
        </div>
      </Card>

      {/* 5. ЖҮЙЕДЕН ШЫҒУ БАТЫРМАСЫ */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 text-sm font-medium text-red-600 py-3 rounded-2xl border border-red-100 bg-red-50 hover:bg-red-100 transition-colors w-full mt-2"
      >
        <LogOut size={16} /> Жүйеден шығу
      </button>

    </div>
  );
}