"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  CreditCard,
  Headphones,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

const globalStyles = `
  @keyframes hero-fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes hero-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-14px); }
  }
  @keyframes feature-glow {
    0%, 100% { box-shadow: 0 14px 35px -22px rgba(6, 78, 59, 0.28); }
    50% { box-shadow: 0 22px 48px -20px rgba(180, 140, 60, 0.30); }
  }
  @keyframes soft-pulse {
    0%, 100% { opacity: 0.65; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.08); }
  }
  @keyframes hero-sheen {
    0%, 100% { transform: translateX(-110%) rotate(12deg); opacity: 0; }
    45%, 55% { opacity: 0.35; }
    85%, 100% { transform: translateX(210%) rotate(12deg); opacity: 0; }
  }
  @keyframes trust-pulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.15); }
  }
`;

function StyleInjector() {
  return <style dangerouslySetInnerHTML={{ __html: globalStyles }} />;
}

function CollectionBadge() {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-emerald-900/15 bg-white/80 py-2 pl-5 pr-2 shadow-[0_12px_30px_-18px_rgba(6,78,59,0.45)] backdrop-blur-md">
      <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-black tracking-wider text-white">
        NEW
      </span>
      <span className="text-xs font-bold tracking-[0.18em] text-emerald-950">
        کلکسیون تابستان ۲۰۲۶
      </span>
    </div>
  );
}

interface LookbookCard {
  title: string;
  subtitle: string;
  code: string;
  gradient: string;
  accent: string;
  text: string;
}

const lookbookCards: LookbookCard[] = [
  {
    title: "تی‌شرت",
    subtitle: "مینیمال و روزمره",
    code: "01",
    gradient: "from-[#f7f4ec] via-[#e8e5da] to-[#cfdcc8]",
    accent: "bg-emerald-700",
    text: "text-emerald-950",
  },
  {
    title: "شلوار",
    subtitle: "فرم دقیق و مدرن",
    code: "02",
    gradient: "from-[#f4efe6] via-[#e6dac5] to-[#d8c6a2]",
    accent: "bg-amber-600",
    text: "text-amber-950",
  },
  {
    title: "کاپشن",
    subtitle: "جزئیات خاص و اصیل",
    code: "03",
    gradient: "from-[#eaf0e9] via-[#d4e2d6] to-[#b8cdbd]",
    accent: "bg-emerald-800",
    text: "text-emerald-950",
  },
  {
    title: "پیراهن",
    subtitle: "انتخابی برای هر موقعیت",
    code: "04",
    gradient: "from-[#f8f4ea] via-[#eadfc6] to-[#d6b87a]",
    accent: "bg-amber-700",
    text: "text-amber-950",
  },
];

interface LookbookDeckProps {
  compact?: boolean;
}

function LookbookDeck({ compact = false }: LookbookDeckProps) {
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveCard((current) => (current + 1) % lookbookCards.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  const stackPositions: CSSProperties[] = [
    {
      transform: "translate3d(0, 0, 0) rotate(0deg) scale(1)",
      opacity: 1,
      zIndex: 40,
    },
    {
      transform: "translate3d(-12px, 12px, 0) rotate(-2deg) scale(0.96)",
      opacity: 0.9,
      zIndex: 30,
    },
    {
      transform: "translate3d(-23px, 24px, 0) rotate(-3.5deg) scale(0.92)",
      opacity: 0.75,
      zIndex: 20,
    },
    {
      transform: "translate3d(-33px, 35px, 0) rotate(-4.5deg) scale(0.88)",
      opacity: 0.56,
      zIndex: 10,
    },
  ];

  return (
    <div
      className="relative mx-auto aspect-[3/4] w-full max-w-sm"
      aria-label="دسته کارت‌های کلکسیون حمزه"
    >
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-1/4 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl" />

      {lookbookCards.map((card, index) => {
        const stackIndex =
          (index - activeCard + lookbookCards.length) % lookbookCards.length;
        const isFront = stackIndex === 0;
        const position = stackPositions[stackIndex];

        return (
          <article
            key={card.title}
            className={`absolute inset-0 overflow-hidden border border-emerald-950/10 bg-gradient-to-br ${card.gradient} ${
              compact ? "rounded-[1.5rem] p-4" : "rounded-[2.35rem] p-6"
            } transition-[transform,opacity,box-shadow,filter] duration-[1100ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isFront
                ? "shadow-[0_35px_65px_-18px_rgba(6,78,59,0.42)]"
                : "shadow-[0_20px_35px_-20px_rgba(6,78,59,0.22)]"
            }`}
            style={position}
            aria-hidden={!isFront}
          >
            <div
              className={`pointer-events-none absolute border border-white/45 ${
                compact ? "inset-2 rounded-[1.1rem]" : "inset-4 rounded-[1.9rem]"
              }`}
            />
            <div
              className={`pointer-events-none absolute border border-dashed border-emerald-950/10 ${
                compact ? "inset-4 rounded-[0.9rem]" : "inset-7 rounded-[1.55rem]"
              }`}
            />

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(255,255,255,0.82),transparent_34%),radial-gradient(circle_at_85%_92%,rgba(6,78,59,0.16),transparent_42%)]" />

            <span
              className={`absolute left-7 font-bold tracking-[0.32em] text-emerald-950/45 ${
                compact ? "top-4 text-[8px]" : "top-7 text-xs"
              }`}
            >
              {card.code}
            </span>

            <div
              className={`absolute inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/65 shadow-sm backdrop-blur-md ${
                compact
                  ? "right-3 top-3 px-2 py-1 text-[8px] font-bold text-emerald-900"
                  : "right-6 top-6 px-3 py-1.5 text-[10px] font-bold text-emerald-900"
              }`}
            >
              <Sparkles
                className={`${compact ? "h-2.5 w-2.5" : "h-3 w-3"} text-amber-500`}
              />
              {isFront ? "در حال نمایش" : "لوکبوک حمزه"}
            </div>

            <div className="relative flex h-full flex-col justify-center">
              <div
                className={`rounded-full shadow-sm ${card.accent} ${
                  compact ? "mb-2 h-1 w-7" : "mb-5 h-1.5 w-14"
                }`}
              />
              <p
                className={`font-bold tracking-[0.22em] text-emerald-950/45 ${
                  compact ? "text-[7px]" : "text-xs"
                }`}
              >
                HAMZEH COLLECTION
              </p>
              <h3
                className={`mt-2 font-black tracking-tight ${card.text} ${
                  compact ? "text-3xl" : "text-6xl"
                }`}
              >
                {card.title}
              </h3>
              <p
                className={`font-medium text-emerald-950/60 ${
                  compact ? "mt-1 text-[10px]" : "mt-3 text-sm"
                }`}
              >
                {card.subtitle}
              </p>
            </div>

            <div
              className={`absolute flex items-end justify-between ${
                compact ? "bottom-3 left-3 right-3" : "bottom-7 left-7 right-7"
              }`}
            >
              <div
                className={`flex items-center justify-center border border-white/60 bg-white/55 text-emerald-800 shadow-sm backdrop-blur-md ${
                  compact ? "h-8 w-8 rounded-xl" : "h-11 w-11 rounded-2xl"
                }`}
              >
                <ShoppingBag className={compact ? "h-3.5 w-3.5" : "h-5 w-5"} />
              </div>
              <span
                className={`font-bold tracking-[0.18em] text-emerald-950/45 ${
                  compact ? "text-[7px]" : "text-[10px]"
                }`}
              >
                SUMMER 2026
              </span>
            </div>

            <div className="pointer-events-none absolute bottom-20 right-10 h-2 w-2 rounded-full bg-amber-400/70 shadow-[0_0_18px_rgba(245,158,11,0.8)]" />
            <div className="pointer-events-none absolute bottom-28 right-16 h-1.5 w-1.5 rounded-full bg-emerald-600/50" />
          </article>
        );
      })}
    </div>
  );
}

interface FeatureRowProps {
  title: string;
  description: string;
  icon: ReactNode;
  delay?: string;
}

function FeatureRow({
  title,
  description,
  icon,
  delay = "0ms",
}: FeatureRowProps) {
  return (
    <div
      className="group flex items-center justify-between gap-4 rounded-[1.6rem] border border-white/70 bg-white/72 px-5 py-4 shadow-[0_20px_40px_-28px_rgba(6,78,59,0.28)] backdrop-blur-md"
      style={{
        animation: `hero-fade-up 900ms ease-out both`,
        animationDelay: delay,
      }}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white shadow-[0_8px_18px_-10px_rgba(6,78,59,0.75)]">
          <ShieldCheck className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-emerald-950 md:text-base">
            {title}
          </h3>
          <p className="mt-1 text-xs leading-6 text-emerald-950/70 md:text-sm">
            {description}
          </p>
        </div>
      </div>
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-950/10 bg-gradient-to-br from-emerald-900 to-emerald-700 text-white"
        style={{ animation: "feature-glow 3.4s ease-in-out infinite" }}
      >
        {icon}
      </div>
    </div>
  );
}

interface TrustItem {
  value: string;
  label: string;
}

const trustItems: TrustItem[] = [
  { value: "+۱۲K", label: "مشتری وفادار" },
  { value: "۴۸h", label: "ارسال سریع" },
  { value: "۹۸٪", label: "رضایت خرید" },
];

export default function LandingPooster() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f4efe4_0%,#f7f3ea_30%,#fbfaf6_62%,#ffffff_100%)] text-emerald-950">
      <StyleInjector />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.75),transparent_38%),linear-gradient(135deg,rgba(6,78,59,0.08),transparent_42%),linear-gradient(315deg,rgba(180,140,60,0.10),transparent_36%)]" />
        <div
          className="absolute left-[-10%] top-[-12%] h-[26rem] w-[26rem] rounded-full bg-emerald-300/18 blur-3xl"
          style={{ animation: "soft-pulse 8s ease-in-out infinite" }}
        />
        <div
          className="absolute right-[-8%] top-[8%] h-[22rem] w-[22rem] rounded-full bg-amber-200/28 blur-3xl"
          style={{ animation: "soft-pulse 9s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-[-10%] left-[25%] h-[18rem] w-[18rem] rounded-full bg-white/70 blur-3xl"
          style={{ animation: "soft-pulse 10s ease-in-out infinite" }}
        />
        <div
          className="absolute inset-y-0 left-[-20%] w-[42%] bg-[linear-gradient(115deg,transparent,rgba(255,255,255,0.65),transparent)]"
          style={{ animation: "hero-sheen 9s ease-in-out infinite" }}
        />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.16]"
          viewBox="0 0 1440 1080"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="hamzeh-grid"
              width="64"
              height="64"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 64 0 L 0 0 0 64"
                fill="none"
                stroke="rgba(6,78,59,0.13)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="1440" height="1080" fill="url(#hamzeh-grid)" />
        </svg>
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.12] mix-blend-soft-light"
          viewBox="0 0 1600 1100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="2"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" opacity="0.22" />
        </svg>

        <div className="absolute left-[6%] top-[16%] h-2 w-2 rounded-full bg-emerald-500/70" />
        <div className="absolute left-[18%] top-[28%] h-1.5 w-1.5 rounded-full bg-amber-500/80" />
        <div className="absolute right-[12%] top-[22%] h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.95)]" />
        <div className="absolute right-[20%] top-[38%] h-1.5 w-1.5 rounded-full bg-emerald-700/55" />
        <div className="absolute bottom-[20%] left-[14%] h-2 w-2 rounded-full bg-amber-400/70" />
        <div className="absolute bottom-[14%] right-[16%] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-900/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-700/20 to-transparent" />

        <div className="test100V absolute left-0 top-0 h-full w-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pb-28 lg:pt-14">
        {/* گرید همیشه دو ستونه — مثل دسکتاپ */}
        <div className="grid grid-cols-2 items-center gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* بلوک متن */}
          <div className="min-w-0">
            <div
              style={{ animation: "hero-fade-up 850ms ease-out both" }}
              className="w-fit"
            >
              <CollectionBadge />
            </div>

            <div
              style={{
                animation: "hero-fade-up 950ms ease-out both",
                animationDelay: "120ms",
              }}
              className="mt-4"
            >
              <p className="text-[10px] font-bold tracking-[0.28em] text-emerald-900/60 lg:text-sm">
                HAMZEH SIGNATURE STYLE
              </p>
             <h1 className="text-4xl font-bold leading-[1.25] tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.15] lg:text-[4.5rem]">
                استایل خاصت را
                <br />
                <span className="relative inline-block bg-gradient-to-l from-amber-800 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                  با حمزه کامل کن
                  <svg
                    className="absolute -bottom-3 left-0 right-0 w-full"
                    viewBox="0 0 200 12"
                    fill="none"
                  >
                    <path
                      d="M2 9C60 2 140 2 198 9"
                      stroke="url(#gold-underline)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.45"
                    />
                    <defs>
                      <linearGradient id="gold-underline" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#b45309" />
                        <stop offset="1" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>
              <p className="mt-8 max-w-lg text-sm leading-8 text-slate-600 sm:mt-10 sm:text-base sm:leading-9 lg:text-lg">
                ترکیبی از طراحی خاص، کیفیت بالا و حس لوکس برای کسانی که در
                انتخاب استایل، به جزئیات اهمیت می‌دهند.
              </p>
            </div>

            <div
              className="mt-4 flex flex-wrap items-center gap-2 lg:mt-7 lg:gap-3"
              style={{
                animation: "hero-fade-up 1000ms ease-out both",
                animationDelay: "220ms",
              }}
            >
              <button className="inline-flex items-center gap-2 rounded-full bg-emerald-900 px-4 py-2 text-xs font-bold text-white shadow-[0_24px_50px_-24px_rgba(6,78,59,0.9)] transition hover:bg-emerald-800 lg:px-6 lg:py-3 lg:text-sm">
                شروع خرید
                <ArrowLeft className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-white/75 px-4 py-2 text-xs font-bold text-emerald-950 shadow-[0_18px_40px_-26px_rgba(6,78,59,0.35)] backdrop-blur-md transition hover:bg-white lg:px-6 lg:py-3 lg:text-sm">
                مشاهده کالکشن
              </button>
            </div>

            <div
              className="mt-4 grid max-w-xl grid-cols-3 gap-2 lg:mt-8 lg:gap-3"
              style={{
                animation: "hero-fade-up 1050ms ease-out both",
                animationDelay: "320ms",
              }}
            >
              {trustItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.4rem] border border-white/70 bg-white/70 px-1 py-3 text-center shadow-[0_18px_40px_-30px_rgba(6,78,59,0.35)] backdrop-blur-md lg:px-2 lg:py-4"
                >
                  <div
                    className="text-sm font-black text-emerald-950 sm:text-base lg:text-lg"
                    style={{
                      animation: "trust-pulse 4.2s ease-in-out infinite",
                    }}
                  >
                    {item.value}
                  </div>
                  <div className="mt-1 text-[9px] font-medium text-emerald-950/65 sm:text-[11px] lg:text-xs">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* دسته کارت — همیشه کنار متن، در موبایل کوچیک‌تر */}
          <div className="min-w-0">
            <div className="mx-auto w-full max-w-[150px] sm:max-w-[200px] lg:mr-0 lg:max-w-lg">
              <div
                className="relative"
                style={{ animation: "hero-float 7.5s ease-in-out infinite" }}
              >
                {/* موبایل: compact — دسکتاپ: کامل */}
                <div className="lg:hidden">
                  <LookbookDeck compact />
                </div>
                <div className="hidden lg:block">
                  <LookbookDeck />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 lg:mt-20">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FeatureRow
              title="ارسال سریع و بسته‌بندی ممتاز"
              description="سفارش‌ها با بسته‌بندی شیک و زمان‌بندی دقیق به دست شما می‌رسند."
              icon={<Truck className="h-5 w-5" />}
              delay="120ms"
            />
            <FeatureRow
              title="پرداخت امن و تجربه خرید مطمئن"
              description="فرآیند پرداخت شفاف، ایمن و سازگار با تجربه خرید حرفه‌ای."
              icon={<CreditCard className="h-5 w-5" />}
              delay="220ms"
            />
            <FeatureRow
              title="پشتیبانی همراه شما"
              description=" انتخاب محصول ، پیگیری سفارش تا پاسخ‌گویی سریع "
              icon={<Headphones className="h-5 w-5" />}
              delay="320ms"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
