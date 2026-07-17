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
} from "lucide-react"; // Бұл жерден Instagram мүлдем өшірілді
import { getSession } from "@/lib/auth";
import Button from "@/components/ui/Button";

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

// ---- Animated count-up, starts only once the element is in view ----
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

const NAV_LINKS = [
  { href: "#how-it-works", label: "Как это работает" },
  { href: "#advantages", label: "Преимущества" },
  { href: "#contacts", label: "Контакты" },
];

const FLOATING_WIDGETS = [
  { icon: CheckCircle2, label: "Выполнение ДЗ", tone: "text-steppe bg-steppe-light", side: "left-0 sm:left-4 top-16", delay: "0s" },
  { icon: BarChart3, label: "Аналитика метрик", tone: "text-horizon-dark bg-horizon/10", side: "right-0 sm:right-4 top-40", delay: "1.2s" },
  { icon: Flame, label: "Серия: 21 день", tone: "text-ember bg-ember-light", side: "left-2 sm:left-10 bottom-10", delay: "2.4s" },
];

const STEPS = [
  {
    icon: Settings2,
    title: "Настройка пространства",
    desc: "Кастомизация целей и правил под ваш курс — без участия разработчиков.",
  },
  {
    icon: Link2,
    title: "Доступ по ссылке",
    desc: "Быстрое приглашение участников без сложных форм и регистраций.",
  },
  {
    icon: Eye,
    title: "Мониторинг результатов",
    desc: "Аналитика активности каждого участника на одном экране.",
  },
];

const ADVANTAGES = [
  {
    icon: Zap,
    title: "Быстрый старт за 10 минут",
    desc: "Zero-code настройка — запуск пространства без разработчиков и технических знаний.",
  },
  {
    icon: BarChart3,
    title: "Прозрачная аналитика",
    desc: "Метрики вовлечённости и прогресса каждого участника — в реальном времени.",
  },
  {
    icon: Palette,
    title: "Фокус на вашем бренде",
    desc: "White-label подход: участники видят только ваш бренд, не платформу.",
  },
];

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

function DashboardPreview() {
  const [ref, inView] = useInView(0.35);
  return (
    <div ref={ref} className="bg-dusk rounded-3xl p-5 sm:p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-ember/70" />
          <span className="h-3 w-3 rounded-full bg-horizon/70" />
          <span className="h-3 w-3 rounded-full bg-steppe/70" />
        </div>
        <span className="text-xs text-white/40 font-medium">Панель организатора · Loopit</span>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Участников", value: 128, color: "bg-horizon" },
          { label: "Отчётов сегодня", value: 94, color: "bg-steppe" },
          { label: "Доводимость курса", value: 78, color: "bg-ember" },
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
            <p className="text-lg font-bold text-white">{stat.value}{stat.label.includes("Доводимость") ? "%" : ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const PRIVACY_TEXT = `ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ И ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ

1. ОБЩИЕ ПОЛОЖЕНИЯ
Настоящая Политика конфиденциальности разработана в соответствии с Законом Республики Казахстан «О персональных данных и их защите» и определяет порядок сбора, обработки и защиты персональных данных пользователей бесплатной SaaS-платформы Loopit.

2. КАКИЕ ДАННЫЕ МЫ СОБИРАЕМ
Мы собираем только те данные, которые необходимы для предоставления услуг Платформы: Имя, адрес электронной почты (Email), номер телефона, юзернеймы в соцсетях. Платформа НЕ собирает и не обрабатывает избыточные данные, включая дату рождения Пользователя.

3. ЦЕЛИ ОБРАБОТКИ
Идентификация Пользователя, предоставление доступа к функционалу создания пространств и челленджей, связь и техническая поддержка.

4. Контакты по вопросам конфиденциальности
hello@loopit.kz, тел: +7 (707) 900-35-65.`;

const TERMS_TEXT = `ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ (ОФЕРТА)

1. ПРЕДМЕТ СОГЛАШЕНИЯ
Настоящее Соглашение является публичной офертой Платформы Loopit, предназначенной для организации марафонов, челленджей и трекинга привычек. Регистрация на Платформе является полным акцептом оферты.

2. ПРАВИЛА ИСПОЛЬЗОВАНИЯ
Платформа предоставляется бесплатно по принципу «как есть» (as is). Администрация не несет ответственности за контент, создаваемый менторами, и за финансовые взаимоотношения организаторов со своими участниками вне платформы.

3. ОБЯЗАННОСТИ
Пользователь обязуется предоставлять достоверные данные и не использовать платформу в запрещенных законодательством РК целях.

4. Контакты
hello@loopit.kz, тел: +7 (707) 900-35-65.`;

function LegalModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-mist-light">
          <h3 className="font-display font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-mist hover:bg-paper-dim">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 text-sm text-mist whitespace-pre-line leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState("2026");

  useEffect(() => {
    setLoggedIn(Boolean(getSession()));
    // Hydration mismatch-тің алдын алу үшін жылды тек клиентте анықтаймыз
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  return (
    <div className="min-h-screen bg-paper overflow-x-hidden">
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
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-ink hover:text-horizon transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {loggedIn ? (
              <Link href="/start"><Button size="sm">В кабинет</Button></Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="secondary" size="sm">Вход</Button>
                </Link>
                <Link href="/register">
                  <button className="h-9 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-horizon to-horizon-deep shadow-lg shadow-horizon/30 hover:from-horizon-dark hover:to-[#4C1D95] hover:shadow-horizon/50 transition-all">
                    Регистрация
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-24">
        <FloatingWidget {...FLOATING_WIDGETS[0]} />
        <FloatingWidget {...FLOATING_WIDGETS[1]} />
        <FloatingWidget {...FLOATING_WIDGETS[2]} />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <span className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-horizon tracking-wide bg-horizon/[0.08] border border-horizon/15">
            🔥 Предложение ограничено: запустите первый челлендж бесплатно
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-ink leading-tight mb-5">
            Готовая платформа для запуска ваших марафонов и челленджей
          </h1>
          <p className="text-mist text-base sm:text-lg max-w-xl mx-auto mb-9">
            Арендуйте интерактивное пространство Loopit. Создавайте кастомные программы
            трекинга, вовлекайте аудиторию и доводите участников до результата — без затрат
            на собственную IT-разработку.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register">
              <button className="h-12 px-6 rounded-xl text-base font-medium text-white bg-gradient-to-r from-horizon to-horizon-deep shadow-lg shadow-horizon/30 hover:from-horizon-dark hover:to-[#4C1D95] hover:scale-105 hover:shadow-horizon/50 transition-all duration-300 inline-flex items-center gap-2">
                Создать пространство <ArrowRight size={16} />
              </button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="secondary">Узнать больше</Button>
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-14">
          Как это работает
        </h2>
        
        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
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
        <DashboardPreview />
      </section>

      {/* Comparison */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-12">
          Loopit vs хаос в мессенджерах
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="bg-paper-dim border border-mist-light rounded-3xl p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-mist mb-3">Рутина в Telegram и WhatsApp</p>
            <h3 className="font-display text-xl font-bold text-ink mb-4">Хаос</h3>
            <ul className="space-y-3 text-sm text-mist">
              <li>Потерянные отчёты в бесконечных чатах</li>
              <li>Ручная проверка каждого сообщения</li>
              <li>Путаница в Excel-таблицах</li>
              <li>Постепенное падение вовлечённости участников</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-horizon to-horizon-dark rounded-3xl p-7 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">Система в Loopit</p>
            <h3 className="font-display text-xl font-bold mb-4">Решение</h3>
            <ul className="space-y-3 text-sm text-white/90">
              <li className="flex gap-2"><CheckCircle2 size={16} className="shrink-0 mt-0.5" /> Автоматизированный сбор отчётов</li>
              <li className="flex gap-2"><CheckCircle2 size={16} className="shrink-0 mt-0.5" /> Наглядные графики прогресса каждого участника</li>
              <li className="flex gap-2"><CheckCircle2 size={16} className="shrink-0 mt-0.5" /> Автоматические напоминания о дедлайнах</li>
              <li className="flex gap-2"><CheckCircle2 size={16} className="shrink-0 mt-0.5" /> Единая методология удержания (Retention)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Metrics — framed as methodology targets, not verified results (product is pre-launch) */}
      <section className="relative overflow-hidden bg-dusk py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
            На что нацелена методология вовлечения
          </h2>
          <p className="text-sm text-white/50 max-w-lg mx-auto mb-14">
            Платформа находится в разработке — ниже целевые показатели, на которые
            рассчитана механика, а не статистика конкретных запусков.
          </p>
          <div className="grid sm:grid-cols-3 gap-10">
            <MetricCounter target={45} suffix="%" label="Потенциальный рост вовлечённости" note="целевой ориентир" />
            <MetricCounter target={85} suffix="%" label="Целевая доводимость до финала" note="целевой ориентир" />
            <MetricCounter target={3} suffix="×" label="Ожидаемый рост повторных продаж (LTV)" note="целевой ориентир" />
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section id="advantages" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-12">
          Преимущества
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {ADVANTAGES.map(({ icon: Icon, title, desc }) => (
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
          Готовы перевести вовлечённость вашего комьюнити на новый уровень?
        </h2>
        <Link href="/register">
          <button className="h-12 px-7 rounded-xl text-base font-medium text-white bg-gradient-to-r from-horizon to-horizon-deep shadow-lg shadow-horizon/30 hover:from-horizon-dark hover:to-[#4C1D95] hover:scale-105 hover:shadow-horizon/50 transition-all duration-300 inline-flex items-center gap-2">
            Запустить платформу <ArrowRight size={16} />
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
              SaaS-платформа для организаторов марафонов и программ вовлечения аудитории.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-mist mb-3">Контакты</p>
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
  <p className="text-xs font-bold uppercase tracking-wider text-mist mb-3">Соцсети</p>
  <ul className="space-y-3">
    <li>
      <a
        href="https://instagram.com/loopit"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 group"
      >
        <span className="bg-pink-50 text-pink-600 w-8 h-8 flex items-center justify-center rounded-full shrink-0">
          {/* Lucide-react орнына қатесіз істейтін SVG белгішесі */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        </span>
        <span className="text-sm font-medium text-ink group-hover:text-pink-600 transition-colors">Instagram</span>
      </a>
    </li>
    <li>
      <a
        href="https://t.me/loopit"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 group"
      >
        <span className="bg-blue-50 text-blue-600 w-8 h-8 flex items-center justify-center rounded-full shrink-0">
          <Send size={14} />
        </span>
        <span className="text-sm font-medium text-ink group-hover:text-blue-600 transition-colors">Telegram</span>
      </a>
    </li>
  </ul>
</div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-mist mb-3">Навигация</p>
            <ul className="space-y-2 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-ink hover:text-horizon transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-mist-light py-6 text-center text-xs text-mist flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>© {currentYear} Loopit. Все права защищены.</span>
          <span className="hidden sm:inline">·</span>
          <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-horizon-dark">Политика конфиденциальности</button>
          <span className="hidden sm:inline">·</span>
          <button onClick={() => setIsTermsOpen(true)} className="hover:text-horizon-dark">Пользовательское соглашение</button>
        </div>
      </footer>

      <LegalModal open={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} title="Политика конфиденциальности">
        {PRIVACY_TEXT}
      </LegalModal>
      <LegalModal open={isTermsOpen} onClose={() => setIsTermsOpen(false)} title="Пользовательское соглашение">
        {TERMS_TEXT}
      </LegalModal>
    </div>
  );
}