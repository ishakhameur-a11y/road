import { useMemo, useState } from "react";
import { initialTasks, habits, type Task } from "../data";
import { addDays, getDaysShort, startOfWeek, toKey } from "../utils/dates";
import { useI18n } from "../i18n";
import { BellIcon, FlameIcon, CheckIcon, ChevronIcon, SparkleIcon } from "../components/Icons";

function ProgressRing({ percent, doneLabel }: { percent: number; doneLabel: string }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="relative grid h-28 w-28 place-items-center">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="ring-anim"
          style={{ "--ring-circ": circ } as React.CSSProperties}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-white">{percent}%</div>
        <div className="text-[10px] text-white/70">{doneLabel}</div>
      </div>
    </div>
  );
}

export default function HomeScreen({ onNavigate }: { onNavigate?: (tab: "tasks" | "habits") => void }) {
  const { lang, t, userName } = useI18n();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [notifOpen, setNotifOpen] = useState(false);
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const dShort = getDaysShort(lang);
  const week = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(today), i));

  const doneCount = tasks.filter((x) => x.done).length;
  const percent = Math.round((doneCount / tasks.length) * 100);

  const priorityStyles: Record<Task["priority"], { label: string; cls: string }> = {
    high: { label: t("عالية", "High"), cls: "bg-rose-500/15 text-rose-400" },
    medium: { label: t("متوسطة", "Medium"), cls: "bg-amber-500/15 text-amber-400" },
    low: { label: t("منخفضة", "Low"), cls: "bg-sky-500/15 text-sky-400" },
  };

  const toggleTask = (id: string) =>
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => Number(a.done) - Number(b.done)),
    [tasks]
  );

  return (
    <div className="space-y-6 px-5 pb-32 pt-4">
      {/* Header */}
      <header className="float-in flex items-center justify-between" style={{ animationDelay: "0ms" }}>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-violet-600/30">
            {userName.charAt(0)}
          </div>
          <div>
            <p className="text-xs text-slate-400">{t("صباح الخير 👋", "Good morning 👋")}</p>
            <h1 className="text-lg font-bold text-white">{userName}</h1>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            aria-label={t("الإشعارات", "Notifications")}
            className={`relative grid h-11 w-11 place-items-center rounded-2xl border transition-colors ${
              notifOpen
                ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <BellIcon />
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#0c0e16]" />
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="float-in absolute start-auto end-0 top-12 z-40 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#161927] shadow-2xl shadow-black/60">
                <p className="border-b border-white/5 px-4 py-2.5 text-[11px] font-bold text-white">
                  {t("الإشعارات", "Notifications")}
                </p>
                {[
                  { emoji: "⏰", text: t("اجتماع فريق التصميم بعد ساعة", "Design team meeting in 1 hour"), time: t("قبل ٥ دقائق", "5 min ago") },
                  { emoji: "🔥", text: t("سلسلة التأمل وصلت ٢١ يوم!", "Meditation streak hit 21 days!"), time: t("قبل ساعتين", "2 hours ago") },
                  { emoji: "🎯", text: t("اقترب موعد هدف إنقاص الوزن", "Weight loss goal deadline is near"), time: t("أمس", "Yesterday") },
                ].map((n, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 px-4 py-3 ${i > 0 ? "border-t border-white/5" : ""}`}
                  >
                    <span className="text-base">{n.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] leading-snug text-slate-200">{n.text}</p>
                      <p className="mt-0.5 text-[9px] text-slate-500">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Week strip */}
      <section className="float-in" style={{ animationDelay: "60ms" }}>
        <div className="flex justify-between gap-1.5">
          {week.map((d) => {
            const isActive = d.getDate() === selectedDay;
            return (
              <button
                key={toKey(d)}
                onClick={() => setSelectedDay(d.getDate())}
                className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2.5 transition-all ${
                  isActive
                    ? "bg-gradient-to-b from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-600/30"
                    : "text-slate-500 hover:bg-white/5"
                }`}
              >
                <span className="text-[10px]">{dShort[d.getDay()]}</span>
                <span className={`text-sm font-bold ${isActive ? "text-white" : "text-slate-300"}`}>
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Progress card */}
      <section
        className="float-in relative overflow-hidden rounded-3xl bg-gradient-to-bl from-violet-600 via-indigo-600 to-indigo-800 p-5 shadow-xl shadow-indigo-900/40"
        style={{ animationDelay: "120ms" }}
      >
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -right-8 h-36 w-36 rounded-full bg-fuchsia-400/20 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium text-white">
              <SparkleIcon className="h-3.5 w-3.5" />
              {t("تقدّم اليوم", "Today's progress")}
            </div>
            <h2 className="text-xl font-bold leading-snug text-white">
              {t(
                `أنجزت ${doneCount} من ${tasks.length} مهام`,
                `Completed ${doneCount} of ${tasks.length} tasks`
              )}
            </h2>
            <p className="text-xs leading-relaxed text-indigo-100/80">
              {percent >= 100
                ? t("رائع! أكملت كل مهام اليوم 🎉", "Amazing! All tasks done today 🎉")
                : t("استمر، أنت على الطريق الصحيح نحو هدفك", "Keep going, you're on the right road")}
            </p>
          </div>
          <ProgressRing percent={percent} doneLabel={t("مكتمل", "Done")} />
        </div>
      </section>

      {/* Quick stats */}
      <section className="float-in grid grid-cols-3 gap-3" style={{ animationDelay: "180ms" }}>
        {[
          { value: String(tasks.length - doneCount), label: t("مهام متبقية", "Tasks left"), color: "text-violet-400", bg: "bg-violet-500/10" },
          { value: "21", label: t("أطول سلسلة", "Best streak"), color: "text-amber-400", bg: "bg-amber-500/10", flame: true },
          { value: "4", label: t("عادات نشطة", "Active habits"), color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border border-white/5 ${s.bg} px-3 py-3.5 text-center`}>
            <div className={`flex items-center justify-center gap-1 text-xl font-bold ${s.color}`}>
              {s.flame && <FlameIcon />}
              {s.value}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Habits row */}
      <section className="float-in space-y-3" style={{ animationDelay: "240ms" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">{t("عاداتك اليوم", "Today's habits")}</h3>
          <button
            onClick={() => onNavigate?.("habits")}
            className="flex items-center gap-0.5 text-xs font-medium text-violet-400"
          >
            {t("عرض الكل", "View all")}
            <ChevronIcon className={`h-3.5 w-3.5 ${lang === "en" ? "rotate-180" : ""}`} />
          </button>
        </div>
        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: "none" }}>
          {habits.map((h) => {
            const pct = Math.min(100, Math.round((h.doneToday / h.goal) * 100));
            return (
              <div
                key={h.id}
                className="w-[120px] shrink-0 rounded-2xl border border-white/5 bg-white/[0.04] p-3.5 transition-colors hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{h.emoji}</span>
                  <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                    <FlameIcon className="h-3 w-3" />
                    {h.streak}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{t(h.title, h.titleEn)}</p>
                <p className="text-[10px] text-slate-500">
                  {h.doneToday}/{h.goal}{" "}
                  {h.goal > 1 ? t("أكواب", "cups") : t("مرة", "time")}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: h.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Today tasks */}
      <section className="float-in space-y-3" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">{t("مهام اليوم", "Today's tasks")}</h3>
          <button
            onClick={() => onNavigate?.("tasks")}
            className="flex items-center gap-0.5 text-xs font-medium text-violet-400"
          >
            {t("عرض الكل", "View all")}
            <ChevronIcon className={`h-3.5 w-3.5 ${lang === "en" ? "rotate-180" : ""}`} />
          </button>
        </div>

        <div className="space-y-2.5">
          {sortedTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`group flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-start transition-all active:scale-[0.98] ${
                task.done
                  ? "border-white/5 bg-white/[0.02] opacity-60"
                  : "border-white/5 bg-white/[0.04] hover:bg-white/[0.07]"
              }`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-all ${
                  task.done
                    ? "border-violet-500 bg-violet-500 text-white"
                    : "border-slate-600 text-transparent group-hover:border-violet-400"
                }`}
              >
                <CheckIcon />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm font-semibold ${
                    task.done ? "text-slate-500 line-through" : "text-white"
                  }`}
                >
                  {t(task.title, task.titleEn)}
                </span>
                <span className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    {t(task.time, task.timeEn)}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ color: task.categoryColor, background: `${task.categoryColor}1f` }}
                  >
                    {t(task.category, task.categoryEn)}
                  </span>
                </span>
              </span>

              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${priorityStyles[task.priority].cls}`}
              >
                {priorityStyles[task.priority].label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Motivation card */}
      <section
        className="float-in rounded-3xl border border-white/5 bg-gradient-to-l from-white/[0.06] to-white/[0.02] p-5"
        style={{ animationDelay: "360ms" }}
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl">🚀</span>
          <div>
            <p className="text-sm font-semibold leading-relaxed text-white">
              {t(
                `"الطريق إلى النجاح يبدأ بخطوة... وأنت قطعت ${percent}% من طريق اليوم"`,
                `"The road to success starts with a step... you've covered ${percent}% of today's road"`
              )}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {t("رود — رفيقك في الإنجاز", "Road — your companion to getting things done")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
