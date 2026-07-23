"use client";

import {
  ChevronRight,
  CreditCard,
  Edit3,
  Send
} from "lucide-react";
import YoutubeIcon from "@/components/ui/YoutubeIcon";
import { useData } from "@/context/DataContext";
import Card from "@/components/ui/Card";
import LoadingState from "@/components/ui/LoadingState";
import InstagramIcon from "@/components/ui/InstagramIcon";

export default function StudentProfilePage() {
  const { ready, currentStudentId, studentData } = useData();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (ready && studentData) {
      setProfile(studentData);
    }
  }, [ready, studentData]);

  if (!ready || !profile) return <LoadingState />;

  const studentName = profile.fullName || profile.name || "Қатысушы";
  const studentEmail = profile.email || "email@example.com";
  const studentId = profile.id ? `ID${profile.id.slice(0, 8).toUpperCase()}` : "ID251040147";
  const grade = profile.grade || "11";
  const subject1 = profile.subject1 || "Информатика";
  const subject2 = profile.subject2 || "Математика";
  const phone = profile.phone || "+7 707 000 00 00";

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 py-4">
      
      {/* 1. БАСТЫ ИНФО КАРТОЧКАСЫ */}
      <Card className="!p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-start justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {/* Аватар / Инициал */}
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl shrink-0">
              {studentName.charAt(0)}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{studentName}</h1>
              </div>
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

      {/* 2. ЕРЕЖЕЛЕР МЕН FAQ */}
      <Card className="!p-0 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
        <a href="#" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-800">Ережелер мен келісімдер</span>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </a>
        <a href="#" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-800">FAQ</span>
          </div>
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
              <YoutubeIcon size={16} />
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
              <InstagramIcon size={16} className="text-white" />
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

    </div>
  );
}