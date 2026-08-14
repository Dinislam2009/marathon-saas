"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  BarChart3,
  Flame,
  Link2,
  Settings2,
  Eye,
  ArrowRight,
  Send,
  Mail,
  Phone,
  Zap,
  Palette,
  X,
} from "lucide-react";
import Button from "@/components/Button";
import { useLanguage } from "@/context/LanguageContext";
import * as actions from "@/app/actions";

// ---- Scroll-triggered visibility hook (IntersectionObserver) ----
function useInView(threshold = 0.3) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ---- Animated count-up ----
function useCountUp(target, inView, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf;
    let start = null;
    function step(ts) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);
  return value;
}

function FloatingWidget({ icon: Icon, label, tone, side, delay }) {
  return (
    <div
      className={`hidden md:flex absolute ${side} items-center gap-2 px-4 py-2.5 rounded-2xl bg-white shadow-lg border border-mist-light animate-float`}
      style={{ animationDelay: delay }}
    >
      <span className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
        <Icon size={16} />
      </span>
      <span className="text-xs font-semibold text-ink whitespace-nowrap">{label}</span>
    </div>
  );
}

function MetricCounter({ target, suffix, label, note }) {
  const [ref, inView] = useInView(0.4);
  const value = useCountUp(target, inView);
  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-2">
        {value}
        {suffix}
      </p>
      <p className="text-sm font-semibold text-white/90">{label}</p>
      {note && <p className="text-xs text-white/50 mt-1">{note}</p>}
    </div>
  );
}

function DashboardPreview({ isRu }) {
  const [ref, inView] = useInView(0.35);
  return (
    <div ref={ref} className="bg-dusk rounded-3xl p-5 sm:p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-ember/70" />
          <span className="h-3 w-3 rounded-full bg-horizon/70" />
          <span className="h-3 w-3 rounded-full bg-steppe/70" />
        </div>
        <span className="text-xs text-white/40 font-medium">
          {isRu ? "Панель организатора · Loopit" : "Ұйымдастырушы панелі · Loopit"}
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: isRu ? "Участников" : "Қатысушылар", value: 128, color: "bg-horizon" },
          { label: isRu ? "Отчётов сегодня" : "Бүгінгі есептер", value: 94, color: "bg-steppe" },
          { label: isRu ? "Доводимость курса" : "Курсты аяқтау", value: 78, color: "bg-ember" },
        ].map((stat, i) => (
          <div key={stat.label} className="bg-white/5 rounded-2xl p-4">
            <p className="text-xs text-white/50 mb-3">{stat.label}</p>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full ${stat.color} transition-all duration-500 ease-out`}
                style={{
                  width: inView ? `${Math.min(stat.value, 100)}%` : "0%",
                  transitionDelay: `${i * 150}ms`,
                }}
              />
            </div>
            <p className="text-lg font-bold text-white">
              {stat.value}{stat.label.includes(isRu ? "Доводимость" : "аяқтау") ? "%" : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstagramIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const PRIVACY_TEXT_RU = `ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ И ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ

1. ОБЩИЕ ПОЛОЖЕНИЯ
Настоящая Политика конфиденциальности разработана в соответствии с Законом Республики Казахстан «О персональных данных и их защите» и определяет порядок сбора, обработки и защиты персональных данных пользователей бесплатной SaaS-платформы Loopit.

2. КАКИЕ ДАННЫЕ МЫ СОБИРАЕМ
Мы собираем только те данные, которые необходимы для предоставления услуг Платформы: Имя, адрес электронной почты (Email), номер телефона, юзернеймы в соцсетях. Платформа НЕ собирает и не обрабатывает избыточные данные.

3. ЦЕЛИ ОБРАБОТКИ
Идентификация Пользователя, предоставление доступа к функционалу создания пространств и челленджей, связь и техническая поддержка.

4. Контакты по вопросам конфиденциальности
hello@loopit.kz, тел: +7 (707) 900-35-65.`;

const PRIVACY_TEXT_KZ = `ҚҰПИЯЛЫЛЫҚ ЖӘНЕ ДЕРЕКТЕРДІ ӨҢДЕУ САЯСАТЫ

1. ЖАЛПЫ ЕРЕЖЕЛЕР
Осы Құпиялылық саясаты Қазақстан Республикасының «Дербес деректер және оларды қорғау туралы» Заңына сәйкес әзірленді және Loopit SaaS платформасы пайдаланушыларының деректерін жинау, өңдеу тәртібін айқындайды.

2. ДЕРЕКТЕРДІ ЖИНАУ
Біз Платформа қызметтерін ұсынуға қажетті деректерді ғана жинаймыз: Аты-жөні, электрондық пошта (Email), телефон нөмірі. Платформа артық деректерді жинамайды.

3. ӨҢДЕУ МАҚСАТТАРЫ
Пайдаланушыны сәйкестендіру, кеңістіктер мен челлендждер құру функционалына қол жеткізуді қамтамасыз ету, кері байланыс.

4. Байланыс
hello@loopit.kz, тел: +7 (707) 900-35-65.`;

const TERMS_TEXT_RU = `ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ (ОФЕРТА)

1. ПРЕДМЕТ СОГЛАШЕНИЯ
Настоящее Соглашение является публичной офертой Платформы Loopit, предназначенной для организации марафонов, челленджей и трекинга привычек. Регистрация на Платформе является полным акцептом оферты.

2. ПРАВИЛА ИСПОЛЬЗОВАНИЯ
Платформа предоставляется бесплатно по принципу «как есть» (as is). Администрация не несет ответственности за контент, создаваемый кураторами, и за финансовые взаимоотношения организаторов со своими участниками вне платформы.

3. ОБЯЗАННОСТИ
Пользователь обязуется предоставлять достоверные данные и не использовать платформу в запрещенных законодательством РК целях.

4. Контакты
hello@loopit.kz, тел: +7 (707) 900-35-65.`;

const TERMS_TEXT_KZ = `ПАЙДАЛАНУШЫ КЕЛІСІМІ (ОФЕРТА)

1. КЕЛІСІМ ПӘНІ
Осы Келісім марафондарды, челлендждерді және әдеттер трекингін ұйымдастыруға арналған Loopit Платформасының ашық офертасы болып табылады. Платформада тіркелу офертаны толық қабылдау болып табылады.

2. ПАЙДАЛАНУ ЕРЕЖЕЛЕРІ
Платформа «қалай бар, солай» (as is) принципі бойынша ұсынылады. Әкімшілік Кураторлар жасайтын контентке және ұйымдастырушылардың қатысушылармен қаржылық қарым-қатынастарына жауапты емес.

3. МІНДЕТТЕР
Пайдаланушы шынайы деректерді ұсынуға және платформаны ҚР заңнамасында тыйым салынған мақсаттарда пайдаланбауға міндеттенеді.

4. Байланыс
hello@loopit.kz, тел: +7 (707) 900-35-65.`;

function LegalModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-mist-light">
          <h3 className="font-display font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-mist hover:bg-paper-dim cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 text-sm text-mist whitespace-pre-line leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { lang, setLang, changeLanguage } = useLanguage();
  const isRu = lang === "ru";

  const [loggedIn, setLoggedIn] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const savedUserId = localStorage.getItem("current_user_id"); 
      const savedOrgId = localStorage.getItem("current_org_id") || "";
      const savedRole = localStorage.getItem("user_role") || "";

      setOrgId(savedOrgId);
      setUserRole(savedRole);

      if (!savedUserId) {
        setLoggedIn(false);
        return;
      }

      setLoggedIn(true);
    }

    checkAuth();
  }, []);

  const handleLanguageToggle = () => {
    const nextLang = isRu ? "kk" : "ru";
    if (typeof setLang === "function") {
      setLang(nextLang);
    } else if (typeof changeLanguage === "function") {
      changeLanguage(nextLang);
    }
  };

  // ⚡ Рөлге сай сілтеме құрастыру
  const getCabinetUrl = () => {
    const role = String(userRole).toUpperCase();
    if (role === "CURATOR") return orgId ? `/${lang}/org/${orgId}/curator` : `/${lang}/login`;
    if (role === "MANAGER") return orgId ? `/${lang}/org/${orgId}/manager` : `/${lang}/login`;
    if (role === "STUDENT") return orgId ? `/${lang}/org/${orgId}/student` : `/${lang}/login`;
    return orgId ? `/${lang}/org/${orgId}/admin` : `/${lang}/login`;
  };

  const navLinks = [
    { href: "#how-it-works", label: isRu ? "Как это работает" : "Бұл қалай жұмыс істейді" },
    { href: "#advantages", label: isRu ? "Преимущества" : "Артықшылықтары" },
    { href: "#contacts", label: isRu ? "Контакты" : "Байланыстар" },
  ];

  const floatingWidgets = [
    { icon: CheckCircle2, label: isRu ? "Выполнение ДЗ" : "Үй тапсырмасы", tone: "text-steppe bg-steppe-light", side: "left-0 sm:left-4 top-16", delay: "0s" },
    { icon: BarChart3, label: isRu ? "Аналитика метрик" : "Метрика аналитикасы", tone: "text-horizon-dark bg-horizon/10", side: "right-0 sm:right-4 top-40", delay: "1.2s" },
    { icon: Flame, label: isRu ? "Серия: 21 день" : "Серия: 21 күн", tone: "text-ember bg-ember-light", side: "left-2 sm:left-10 bottom-10", delay: "2.4s" },
  ];

  const steps = [
    {
      icon: Settings2,
      title: isRu ? "Настройка пространства" : "Кеңістікті баптау",
      desc: isRu ? "Кастомизация целей и правил под ваш курс — без участия разработчиков." : "Курсыңызға сәйкес мақсаттар мен ережелерді бағдарламашыларсыз баптау.",
    },
    {
      icon: Link2,
      title: isRu ? "Доступ по ссылке" : "Сілтеме арқылы кіру",
      desc: isRu ? "Быстрое приглашение участников без сложных форм и регистраций." : "Күрделі тіркелулерсіз қатысушыларды жылдам шақыру.",
    },
    {
      icon: Eye,
      title: isRu ? "Мониторинг результатов" : "Нәтижелер мониторингі",
      desc: isRu ? "Аналитика активности каждого участника на одном экране." : "Әрбір қатысушының белсенділік аналитикасы бір экранда.",
    },
  ];

  const advantages = [
    {
      icon: Zap,
      title: isRu ? "Быстрый старт за 10 минут" : "10 минутта жылдам бастау",
      desc: isRu ? "Zero-code настройка — запуск пространства без разработчиков и технических знаний." : "Zero-code баптау — техникалық білімсіз кеңістікті іске қосу.",
    },
    {
      icon: BarChart3,
      title: isRu ? "Прозрачная аналитика" : "Ашық аналитика",
      desc: isRu ? "Метрики вовлечённости и прогресса каждого участника — в реальном времени." : "Әрбір қатысушының нақты уақыттағы прогресс көрсеткіштері.",
    },
    {
      icon: Palette,
      title: isRu ? "Фокус на вашем бренде" : "Брендіңізге басымдық",
      desc: isRu ? "White-label подход: участники видят только ваш бренд, не платформу." : "White-label тәсілі: қатысушылар тек сіздің брендіңізді көреді.",
    },
  ];

  return (
    <div className="min-h-screen bg-paper overflow-x-hidden font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 h-16 flex items-center bg-white/80 backdrop-blur-md border-b border-mist-light">
        <div className="max-w-6xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Loopit" className="h-9 w-9 object-contain" />
            <span className="font-display font-extrabold text-xl text-ink">
              LOOP<span className="text-horizon">IT</span>
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-ink hover:text-horizon transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* 🌐 Language Switcher */}
            <button
              onClick={handleLanguageToggle}
              className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors cursor-pointer border border-gray-200"
            >
              {isRu ? "KZ" : "RU"}
            </button>

            {loggedIn ? (
              <Link href={getCabinetUrl()}>
                <Button size="sm" className="cursor-pointer">
                  {isRu ? "В кабинет" : "Кабинетке"}
                </Button>
              </Link>
            ) : (
              <>
                <Link href={`/${lang}/login`}>
                  <Button variant="secondary" size="sm" className="cursor-pointer">{isRu ? "Вход" : "Кіру"}</Button>
                </Link>
                <Link href={`/${lang}/register`}>
                  <button className="h-9 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-horizon to-horizon-deep shadow-lg shadow-horizon/30 hover:from-horizon-dark hover:to-[#4C1D95] transition-all cursor-pointer">
                    {isRu ? "Регистрация" : "Тіркелу"}
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-24">
        <FloatingWidget {...floatingWidgets[0]} />
        <FloatingWidget {...floatingWidgets[1]} />
        <FloatingWidget {...floatingWidgets[2]} />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <span className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-horizon tracking-wide bg-horizon/[0.08] border border-horizon/15">
            {isRu ? "🔥 Предложение ограничено: запустите первый челлендж бесплатно" : "🔥 Шектеулі ұсыныс: алғашқы челленджді тегін іске қосыңыз"}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-ink leading-tight mb-5">
            {isRu
              ? "Готовая платформа для запуска ваших марафонов и челленджей"
              : "Марафондар мен челлендждерді іске қосуға арналған дайын платформа"}
          </h1>
          <p className="text-mist text-base sm:text-lg max-w-xl mx-auto mb-9">
            {isRu
              ? "Арендуйте интерактивное пространство Loopit. Создавайте кастомные программы трекинга, вовлекайте аудиторию и доводите участников до результата."
              : "Loopit интерактивті кеңістігін жалға алыңыз. Өз бағдарламаларыңызды жасап, аудиторияны баурап алыңыз және қатысушыларды нәтижеге жеткізіңіз."}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href={`/${lang}/register`}>
              <button className="h-12 px-6 rounded-xl text-base font-medium text-white bg-gradient-to-r from-horizon to-horizon-deep shadow-lg shadow-horizon/30 hover:from-horizon-dark hover:to-[#4C1D95] hover:scale-105 transition-all duration-300 inline-flex items-center gap-2 cursor-pointer">
                {isRu ? "Создать пространство" : "Кеңістік құру"} <ArrowRight size={16} />
              </button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="secondary" className="cursor-pointer">
                {isRu ? "Узнать больше" : "Толығырақ танысу"}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-14">
          {isRu ? "Как это работает" : "Бұл қалай жұмыс істейді"}
        </h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="text-center">
              <div className="relative inline-flex mb-4">
                <div className="h-14 w-14 rounded-2xl bg-horizon/10 flex items-center justify-center text-horizon-dark">
                  <Icon size={24} />
                </div>
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-horizon text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display font-semibold text-ink mb-2">{title}</h3>
              <p className="text-sm text-mist leading-relaxed max-w-xs mx-auto">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live dashboard mockup */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <DashboardPreview isRu={isRu} />
      </section>

      {/* Comparison */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-12">
          {isRu ? "Loopit vs хаос в мессенджерах" : "Loopit vs мессенджердегі хаос"}
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="bg-paper-dim border border-mist-light rounded-3xl p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-mist mb-3">
              {isRu ? "Рутина в Telegram и WhatsApp" : "Telegram және WhatsApp рутинасы"}
            </p>
            <h3 className="font-display text-xl font-bold text-ink mb-4">
              {isRu ? "Хаос" : "Хаос"}
            </h3>
            <ul className="space-y-3 text-sm text-mist">
              <li>{isRu ? "Потерянные отчёты в бесконечных чатах" : "Шексіз чаттарда жоғалған есептер"}</li>
              <li>{isRu ? "Ручная проверка каждого сообщения" : "Әр хабарламаны қолмен тексеру"}</li>
              <li>{isRu ? "Путаница в Excel-таблицах" : "Excel кестелеріндегі шатасулар"}</li>
              <li>{isRu ? "Постепенное падение вовлечённости участников" : "Қатысушылар белсенділігінің төмендеуі"}</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-horizon to-horizon-dark rounded-3xl p-7 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">
              {isRu ? "Система в Loopit" : "Loopit жүйесі"}
            </p>
            <h3 className="font-display text-xl font-bold mb-4">
              {isRu ? "Решение" : "Шешім"}
            </h3>
            <ul className="space-y-3 text-sm text-white/90">
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> 
                {isRu ? "Автоматизированный сбор отчётов" : "Есептерді автоматты түрде жинау"}
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> 
                {isRu ? "Наглядные графики прогресса каждого участника" : "Әрбір қатысушының анық прогресс графигі"}
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> 
                {isRu ? "Автоматические напоминания о дедлайнах" : "Дедлайндар туралы автоматты ескертулер"}
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> 
                {isRu ? "Единая методология удержания (Retention)" : "Бірыңғай ұстап тұру методологиясы (Retention)"}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="relative overflow-hidden bg-dusk py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
            {isRu ? "На что нацелена методология вовлечения" : "Қызығушылықты арттыру методологиясының мақсаты"}
          </h2>
          <p className="text-sm text-white/50 max-w-lg mx-auto mb-14">
            {isRu 
              ? "Целевые показатели, на которые рассчитана механика платформы." 
              : "Платформа механикасы есептелген мақсатты көрсеткіштер."}
          </p>
          <div className="grid sm:grid-cols-3 gap-10">
            <MetricCounter target={45} suffix="%" label={isRu ? "Потенциальный рост вовлечённости" : "Белсенділіктің потенциалды өсуі"} note={isRu ? "целевой ориентир" : "мақсатты бағдар"} />
            <MetricCounter target={85} suffix="%" label={isRu ? "Целевая доводимость до финала" : "Финалға дейін аяқтау көрсеткіші"} note={isRu ? "целевой ориентир" : "мақсатты бағдар"} />
            <MetricCounter target={3} suffix="×" label={isRu ? "Ожидаемый рост повторных продаж (LTV)" : "Қайта сатулардың өсуі (LTV)"} note={isRu ? "целевой ориентир" : "мақсатты бағдар"} />
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section id="advantages" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-12">
          {isRu ? "Преимущества" : "Артықшылықтары"}
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {advantages.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white border border-mist-light rounded-2xl p-6 hover:-translate-y-1.5 hover:shadow-xl hover:border-horizon/30 transition-all duration-300"
            >
              <div className="h-11 w-11 rounded-xl bg-horizon/10 flex items-center justify-center text-horizon-dark mb-4">
                <Icon size={20} />
              </div>
              <h3 className="font-display font-semibold text-ink mb-2">{title}</h3>
              <p className="text-sm text-mist leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-7">
          {isRu 
            ? "Готовы перевести вовлечённость вашего комьюнити на новый уровень?" 
            : "Комьюнити белсенділігін жаңа деңгейге көтеруге дайынсыз ба?"}
        </h2>
        <Link href={`/${lang}/register`}>
          <button className="h-12 px-7 rounded-xl text-base font-medium text-white bg-gradient-to-r from-horizon to-horizon-deep shadow-lg shadow-horizon/30 hover:from-horizon-dark hover:to-[#4C1D95] hover:scale-105 transition-all duration-300 inline-flex items-center gap-2 cursor-pointer">
            {isRu ? "Запустить платформу" : "Платформаны іске қосу"} <ArrowRight size={16} />
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer id="contacts" className="border-t border-mist-light bg-paper-dim/40">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Loopit" className="h-9 w-9 object-contain" />
              <span className="font-display font-extrabold text-xl text-ink">
                LOOP<span className="text-horizon">IT</span>
              </span>
            </div>
            <p className="text-sm text-mist leading-relaxed max-w-xs">
              {isRu 
                ? "SaaS-платформа для организаторов марафонов и программ вовлечения аудитории." 
                : "Марафон ұйымдастырушылары мен аудиторияны тарту бағдарламаларына арналған SaaS-платформа."}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-mist mb-3">
              {isRu ? "Контакты" : "Байланыстар"}
            </p>
            <ul className="space-y-2.5 text-sm text-ink">
              <li>
                <a href="tel:+77079003565" className="flex items-center gap-2 hover:text-horizon-dark transition-colors">
                  <Phone size={14} className="text-mist" /> +7 (707) 900-35-65
                </a>
              </li>
              <li>
                <a href="mailto:hello@loopit.kz" className="flex items-center gap-2 hover:text-horizon-dark transition-colors">
                  <Mail size={14} className="text-mist" /> hello@loopit.kz
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-mist mb-3">
              {isRu ? "Соцсети" : "Әлеуметтік желілер"}
            </p>
            <ul className="space-y-3">
              <li>
                <a href="https://instagram.com/loopit" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 group">
                  <span className="bg-pink-50 text-pink-600 w-8 h-8 flex items-center justify-center rounded-full shrink-0">
                    <InstagramIcon size={14} />
                  </span>
                  <span className="text-sm font-medium text-ink group-hover:text-pink-600 transition-colors">Instagram</span>
                </a>
              </li>
              <li>
                <a href="https://t.me/loopit" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 group">
                  <span className="bg-blue-50 text-blue-600 w-8 h-8 flex items-center justify-center rounded-full shrink-0">
                    <Send size={14} />
                  </span>
                  <span className="text-sm font-medium text-ink group-hover:text-blue-600 transition-colors">Telegram</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-mist mb-3">
              {isRu ? "Навигация" : "Навигация"}
            </p>
            <ul className="space-y-2 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-ink hover:text-horizon transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-mist-light py-6 text-center text-xs text-mist flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>© {new Date().getFullYear()} Loopit. {isRu ? "Все права защищены." : "Барлық құқықтар қорғалған."}</span>
          <span className="hidden sm:inline">·</span>
          <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-horizon-dark cursor-pointer">
            {isRu ? "Политика конфиденциальности" : "Құпиялылық саясаты"}
          </button>
          <span className="hidden sm:inline">·</span>
          <button onClick={() => setIsTermsOpen(true)} className="hover:text-horizon-dark cursor-pointer">
            {isRu ? "Пользовательское соглашение" : "Пайдаланушы келісімі"}
          </button>
        </div>
      </footer>

      <LegalModal open={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} title={isRu ? "Политика конфиденциальности" : "Құпиялылық саясаты"}>
        {isRu ? PRIVACY_TEXT_RU : PRIVACY_TEXT_KZ}
      </LegalModal>
      <LegalModal open={isTermsOpen} onClose={() => setIsTermsOpen(false)} title={isRu ? "Пользовательское соглашение" : "Пайдаланушы келісімі"}>
        {isRu ? TERMS_TEXT_RU : TERMS_TEXT_KZ}
      </LegalModal>
    </div>
  );
}