import { useState } from "react";
import { FlameIcon, CheckIcon } from "../components/Icons";
import { useI18n, ACCENTS } from "../i18n";
import { getDaysShort } from "../utils/dates";

/* ---------------------------------- data ---------------------------------- */

const SKY = "#38bdf8";

interface Achievement {
  id: string;
  emoji: string;
  ar: string;
  en: string;
  descAr: string;
  descEn: string;
  unlocked: boolean;
  progress?: string;
}

const achievements: Achievement[] = [
  { id: "a1", emoji: "🌱", ar: "البداية", en: "First Step", descAr: "أكمل أول مهمة لك", descEn: "Complete your first task", unlocked: true },
  { id: "a2", emoji: "🔥", ar: "أسبوع ناري", en: "Hot Week", descAr: "سلسلة 7 أيام متواصلة", descEn: "7-day streak", unlocked: true },
  { id: "a3", emoji: "⚡", ar: "منجز سريع", en: "Fast Achiever", descAr: "أنجز 50 مهمة", descEn: "Complete 50 tasks", unlocked: true, progress: "50/50" },
  { id: "a4", emoji: "🧘", ar: "صفاء ذهني", en: "Clear Mind", descAr: "21 يوم تأمل متواصل", descEn: "21 days of meditation", unlocked: true },
  { id: "a5", emoji: "🏆", ar: "بطل الشهر", en: "Month Champion", descAr: "أكمل 90% من مهام شهر كامل", descEn: "Complete 90% of a month's tasks", unlocked: false, progress: "67%" },
  { id: "a6", emoji: "💎", ar: "ماراثوني", en: "Marathoner", descAr: "سلسلة 30 يوم متواصلة", descEn: "30-day streak", unlocked: false, progress: "21/30" },
  { id: "a7", emoji: "🚀", ar: "محقق الأحلام", en: "Dream Maker", descAr: "حقق 5 أهداف كاملة", descEn: "Achieve 5 full goals", unlocked: false, progress: "1/5" },
  { id: "a8", emoji: "👑", ar: "أسطورة", en: "Legend", descAr: "100 يوم من الالتزام", descEn: "100 days of commitment", unlocked: false, progress: "61/100" },
];

// يبدأ من السبت: ترتيب getDay => [6,0,1,2,3,4,5]
const weekData = [
  { dayIdx: 6, pct: 80 },
  { dayIdx: 0, pct: 100 },
  { dayIdx: 1, pct: 60 },
  { dayIdx: 2, pct: 90 },
  { dayIdx: 3, pct: 100 },
  { dayIdx: 4, pct: 45 },
  { dayIdx: 5, pct: 70 },
];

/* --------------------------------- screen --------------------------------- */

export default function MoreScreen() {
  const { lang, setLang, accent, setAccent, userName, setUserName, t } = useI18n();
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [weekStart, setWeekStart] = useState<"sat" | "sun">("sat");
  const [achOpen, setAchOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName);

  const dShort = getDaysShort(lang);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const saveName = () => {
    if (nameDraft.trim()) setUserName(nameDraft.trim());
    setEditingName(false);
  };

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-32 pt-5">
        {/* ---------- profile card ---------- */}
        <section className="float-in relative overflow-hidden rounded-3xl bg-gradient-to-bl from-violet-600 via-indigo-600 to-indigo-800 p-5">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -right-8 h-36 w-36 rounded-full bg-fuchsia-400/20 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-bold text-white ring-2 ring-white/30">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    className="min-w-0 flex-1 rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-bold text-white placeholder:text-white/50 focus:outline-none"
                    placeholder={t("اسمك…", "Your name…")}
                  />
                  <button
                    onClick={saveName}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/20 text-white transition-all active:scale-90"
                    aria-label={t("حفظ", "Save")}
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-bold text-white">{userName}</h2>
                  {/* edit name icon */}
                  <button
                    onClick={() => {
                      setNameDraft(userName);
                      setEditingName(true);
                    }}
                    aria-label={t("تعديل الاسم", "Edit name")}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/15 text-white/80 transition-all hover:bg-white/25 active:scale-90"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
                    </svg>
                  </button>
                </div>
              )}
              <p className="text-xs text-indigo-100/80">{t("عضو منذ يناير 2026", "Member since January 2026")}</p>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-white">
                {t("⭐ المستوى 8 — مثابر", "⭐ Level 8 — Persistent")}
              </div>
            </div>
          </div>
          {/* level progress */}
          <div className="relative mt-4">
            <div className="flex items-center justify-between text-[10px] text-indigo-100/80">
              <span>{t("1,240 نقطة", "1,240 points")}</span>
              <span>{t("المستوى 9 عند 1,500", "Level 9 at 1,500")}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-[82%] rounded-full bg-gradient-to-l from-amber-300 to-amber-400" />
            </div>
          </div>
        </section>

        {/* ---------- stats overview ---------- */}
        <section className="float-in grid grid-cols-4 gap-2" style={{ animationDelay: "60ms" }}>
          {[
            { v: "127", l: t("مهمة منجزة", "Tasks done"), c: "#34d399" },
            { v: "21", l: t("أطول سلسلة", "Best streak"), c: "#fbbf24", flame: true },
            { v: "4", l: t("عادات نشطة", "Active habits"), c: SKY },
            { v: "1", l: t("هدف محقق", "Goal achieved"), c: "#a78bfa" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-white/5 bg-white/[0.04] py-3 text-center">
              <div className="flex items-center justify-center gap-0.5 text-lg font-bold" style={{ color: s.c }}>
                {s.flame && <FlameIcon className="h-4 w-4" />}
                {s.v}
              </div>
              <div className="mt-0.5 text-[9px] text-slate-500">{s.l}</div>
            </div>
          ))}
        </section>

        {/* ---------- weekly chart ---------- */}
        <section
          className="float-in rounded-2xl border border-white/5 bg-white/[0.04] p-4"
          style={{ animationDelay: "120ms" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">{t("إنتاجية هذا الأسبوع", "This week's productivity")}</h3>
            <span className="text-[10px] text-slate-500">
              {t("المعدل", "Avg")} {Math.round(weekData.reduce((a, d) => a + d.pct, 0) / 7)}%
            </span>
          </div>
          <div className="flex gap-2">
            {/* y-axis percentage scale */}
            <div className="flex h-28 flex-col justify-between pb-[26px] pt-[18px] text-[8px] text-slate-600">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
            <div className="relative flex h-28 flex-1 items-end justify-between gap-2">
              {/* reference gridlines */}
              <div className="pointer-events-none absolute inset-x-0 bottom-[26px] top-[18px]">
                {[0, 25, 50, 75, 100].map((p) => (
                  <div
                    key={p}
                    className="absolute inset-x-0 border-t border-dashed border-white/[0.07]"
                    style={{ bottom: `${p}%` }}
                  />
                ))}
              </div>
              {weekData.map((d) => (
                <div key={d.dayIdx} className="relative flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400">{d.pct}%</span>
                  <div className="flex h-[68px] w-full items-end overflow-hidden rounded-lg bg-white/5">
                    <div
                      className="w-full rounded-lg transition-all duration-700"
                      style={{
                        height: `${d.pct}%`,
                        background:
                          d.pct >= 80
                            ? "linear-gradient(to top, #6d28d9, #a78bfa)"
                            : d.pct >= 60
                              ? "linear-gradient(to top, #0369a1, #38bdf8)"
                              : "rgba(255,255,255,0.15)",
                      }}
                    />
                  </div>
                  {/* اسم اليوم واضح وليس حرفاً */}
                  <span className="text-[8px] font-semibold text-slate-400">{dShort[d.dayIdx]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- achievements ---------- */}
        <section className="float-in" style={{ animationDelay: "180ms" }}>
          <button
            onClick={() => setAchOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07]"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/15 text-xl">🏆</span>
              <div className="text-start">
                <p className="text-sm font-bold text-white">{t("الإنجازات", "Achievements")}</p>
                <p className="text-[10px] text-slate-500">
                  {t(
                    `فتحت ${unlockedCount} من ${achievements.length} إنجازات`,
                    `Unlocked ${unlockedCount} of ${achievements.length}`
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {achievements
                  .filter((a) => a.unlocked)
                  .slice(0, 3)
                  .map((a) => (
                    <span
                      key={a.id}
                      className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-[#1a1d2e] text-xs"
                    >
                      {a.emoji}
                    </span>
                  ))}
              </div>
              <svg viewBox="0 0 24 24" className={`h-4 w-4 text-slate-500 ${lang === "en" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </div>
          </button>
        </section>

        {/* ---------- settings ---------- */}
        <section className="float-in space-y-2" style={{ animationDelay: "240ms" }}>
          <h3 className="px-1 text-[11px] font-bold text-slate-500">{t("الإعدادات", "Settings")}</h3>

          <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.04]">
            {/* language */}
            <div className="flex items-center gap-3 p-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-base">🌐</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white">{t("اللغة", "Language")}</p>
                <p className="text-[10px] text-slate-500">{t("لغة التطبيق بالكامل", "Full app language")}</p>
              </div>
              <div className="flex rounded-xl border border-white/10 bg-white/5 p-0.5">
                {(
                  [
                    { id: "ar", label: "العربية" },
                    { id: "en", label: "English" },
                  ] as { id: "ar" | "en"; label: string }[]
                ).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setLang(o.id)}
                    className={`rounded-[10px] px-2.5 py-1 text-[10px] font-medium transition-all ${
                      lang === o.id ? "bg-violet-500 text-white" : "text-slate-400"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5" />

            {/* theme / accent color */}
            <div className="flex items-center gap-3 p-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-base">🎨</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white">{t("لون التطبيق (الثيم)", "App color (Theme)")}</p>
                <p className="text-[10px] text-slate-500">
                  {ACCENTS.find((a) => a.id === accent)?.[lang === "ar" ? "nameAr" : "nameEn"]}
                </p>
              </div>
              <div className="flex gap-1.5">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAccent(a.id)}
                    aria-label={a.nameEn}
                    className={`grid h-7 w-7 place-items-center rounded-full transition-transform active:scale-90 ${
                      accent === a.id ? "ring-2 ring-white ring-offset-2 ring-offset-[#161927]" : ""
                    }`}
                    style={{ background: a.color }}
                  >
                    {accent === a.id && <CheckIcon className="h-3 w-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5" />
            <ToggleRow
              emoji="🔔"
              title={t("الإشعارات", "Notifications")}
              desc={t("تذكير بالمهام والعادات", "Task & habit reminders")}
              value={notifications}
              onChange={setNotifications}
            />
            <div className="border-t border-white/5" />
            <ToggleRow
              emoji="🔊"
              title={t("الأصوات", "Sounds")}
              desc={t("صوت عند إنجاز مهمة", "Sound on task completion")}
              value={sounds}
              onChange={setSounds}
            />
            <div className="border-t border-white/5" />
            <ToggleRow
              emoji="📳"
              title={t("الاهتزاز", "Vibration")}
              desc={t("اهتزاز خفيف عند التفاعل", "Light haptic feedback")}
              value={vibration}
              onChange={setVibration}
            />
            <div className="border-t border-white/5" />
            {/* week start */}
            <div className="flex items-center gap-3 p-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-base">📅</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white">{t("بداية الأسبوع", "Week starts on")}</p>
                <p className="text-[10px] text-slate-500">{t("اليوم الأول في التقويم", "First day of the calendar")}</p>
              </div>
              <div className="flex rounded-xl border border-white/10 bg-white/5 p-0.5">
                {(
                  [
                    { id: "sat", label: t("السبت", "Sat") },
                    { id: "sun", label: t("الأحد", "Sun") },
                  ] as { id: "sat" | "sun"; label: string }[]
                ).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setWeekStart(o.id)}
                    className={`rounded-[10px] px-2.5 py-1 text-[10px] font-medium transition-all ${
                      weekStart === o.id ? "bg-violet-500 text-white" : "text-slate-400"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- general ---------- */}
        <section className="float-in space-y-2" style={{ animationDelay: "300ms" }}>
          <h3 className="px-1 text-[11px] font-bold text-slate-500">{t("عام", "General")}</h3>
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.04]">
            {[
              { emoji: "📤", title: t("تصدير البيانات", "Export data"), desc: t("نسخة احتياطية من مهامك", "Backup your tasks") },
              { emoji: "⭐", title: t("قيّم التطبيق", "Rate the app"), desc: t("ساعدنا بالنمو", "Help us grow") },
              { emoji: "💬", title: t("تواصل معنا", "Contact us"), desc: t("اقتراحات ومشاكل", "Suggestions & issues") },
              { emoji: "🔒", title: t("الخصوصية", "Privacy"), desc: t("بياناتك محفوظة على جهازك", "Your data stays on your device") },
            ].map((r, i) => (
              <div key={r.title}>
                {i > 0 && <div className="border-t border-white/5" />}
                <button className="flex w-full items-center gap-3 p-3.5 text-start transition-colors hover:bg-white/[0.03]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-base">
                    {r.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-white">{r.title}</span>
                    <span className="block text-[10px] text-slate-500">{r.desc}</span>
                  </span>
                  <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 text-slate-600 ${lang === "en" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 6-6 6 6 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- app footer ---------- */}
        <section className="float-in pt-2 text-center" style={{ animationDelay: "360ms" }}>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-black text-white shadow-lg shadow-violet-600/30">
            R
          </div>
          <p className="mt-2 text-xs font-bold text-white">{t("Road | رود", "Road")}</p>
          <p className="text-[10px] text-slate-600">
            {t("الإصدار 1.0.0 — رفيقك في الإنجاز 🚀", "Version 1.0.0 — your companion 🚀")}
          </p>
        </section>
      </div>

      {/* ---------- achievements sheet ---------- */}
      {achOpen && (
        <div className="absolute inset-0 z-40 flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAchOpen(false)} />
          <div className="float-in relative max-h-[85%] w-full overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#11131e] p-5 pb-8 shadow-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{t("الإنجازات 🏆", "Achievements 🏆")}</h3>
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-400">
                {unlockedCount}/{achievements.length}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-2xl border p-3.5 text-center transition-all ${
                    a.unlocked
                      ? "border-amber-500/25 bg-amber-500/10"
                      : "border-white/5 bg-white/[0.03] opacity-60"
                  }`}
                >
                  <span className={`text-3xl ${a.unlocked ? "" : "grayscale"}`}>{a.emoji}</span>
                  <p className={`mt-1.5 text-xs font-bold ${a.unlocked ? "text-amber-300" : "text-slate-400"}`}>
                    {t(a.ar, a.en)}
                  </p>
                  <p className="mt-0.5 text-[9px] leading-relaxed text-slate-500">{t(a.descAr, a.descEn)}</p>
                  {a.unlocked ? (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                      <CheckIcon className="h-2.5 w-2.5" /> {t("مفتوح", "Unlocked")}
                    </span>
                  ) : (
                    a.progress && (
                      <span className="mt-2 inline-block rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                        {a.progress}
                      </span>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- toggle row ------------------------------- */

function ToggleRow({
  emoji,
  title,
  desc,
  value,
  onChange,
}: {
  emoji: string;
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-base">{emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-white">{title}</p>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          value ? "bg-violet-500" : "bg-white/10"
        }`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            value ? "end-1" : "end-6"
          }`}
        />
      </button>
    </div>
  );
}
