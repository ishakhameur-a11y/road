import { useState } from "react";
import { addDays, getDaysShort, isSameDay, toKey, type Lng } from "../utils/dates";
import { CheckIcon, FlameIcon, PlusIcon } from "../components/Icons";
import { useI18n } from "../i18n";

/* ---------------------------------- types --------------------------------- */

interface Habit {
  id: string;
  title: string;
  emoji: string;
  goal: number;
  unit: string;
  weekdays: number[];
  log: Record<string, number>;
  createdAt: string;
}

const SKY = "#38bdf8";
const EMOJIS = ["💧", "📖", "🧘", "🏃", "💪", "🥗", "😴", "✍️", "🚶", "🧠", "🙏", "☕"];

type StatPeriod = "today" | "week" | "month";

/* ---------------------------------- seed ---------------------------------- */

const today = new Date();
const tKey = toKey(today);

function buildLog(pattern: number[], goal: number): Record<string, number> {
  const log: Record<string, number> = {};
  pattern.forEach((p, i) => {
    if (p > 0) log[toKey(addDays(today, -(i + 1)))] = Math.round(p * goal);
  });
  return log;
}

function makeSeed(lang: Lng): Habit[] {
  const T = (ar: string, en: string) => (lang === "ar" ? ar : en);
  return [
    {
      id: "h1",
      title: T("شرب الماء", "Drink water"),
      emoji: "💧",
      goal: 8,
      unit: T("أكواب", "cups"),
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      log: { ...buildLog([1, 1, 0.75, 1, 1, 0.5, 1, 1, 1, 0.6, 1, 1], 8), [tKey]: 5 },
      createdAt: toKey(addDays(today, -40)),
    },
    {
      id: "h2",
      title: T("قراءة ٢٠ صفحة", "Read 20 pages"),
      emoji: "📖",
      goal: 1,
      unit: T("مرة", "time"),
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      log: { ...buildLog([1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1], 1), [tKey]: 1 },
      createdAt: toKey(addDays(today, -30)),
    },
    {
      id: "h3",
      title: T("تأمل ١٠ دقائق", "Meditate 10 min"),
      emoji: "🧘",
      goal: 1,
      unit: T("مرة", "time"),
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      log: buildLog([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 1),
      createdAt: toKey(addDays(today, -60)),
    },
    {
      id: "h4",
      title: T("رياضة", "Exercise"),
      emoji: "🏃",
      goal: 1,
      unit: T("مرة", "time"),
      weekdays: [0, 1, 3, 5],
      log: buildLog([0, 1, 0, 1, 1, 0, 0, 1], 1),
      createdAt: toKey(addDays(today, -20)),
    },
  ];
}

/* --------------------------------- helpers -------------------------------- */

function calcStreak(h: Habit, from: Date): number {
  let streak = 0;
  let d = new Date(from);
  if ((h.log[toKey(d)] ?? 0) >= h.goal) streak++;
  d = addDays(d, -1);
  for (let i = 0; i < 365; i++) {
    if (!h.weekdays.includes(d.getDay())) {
      d = addDays(d, -1);
      continue;
    }
    if ((h.log[toKey(d)] ?? 0) >= h.goal) {
      streak++;
      d = addDays(d, -1);
    } else break;
  }
  return streak;
}

function bestStreak(h: Habit): number {
  let best = 0;
  let cur = 0;
  for (let i = 90; i >= 0; i--) {
    const d = addDays(today, -i);
    if (!h.weekdays.includes(d.getDay())) continue;
    if ((h.log[toKey(d)] ?? 0) >= h.goal) {
      cur++;
      best = Math.max(best, cur);
    } else if (i !== 0) {
      cur = 0;
    }
  }
  return best;
}

/** بداية الأسبوع = السبت */
function weekStartSat(d: Date): Date {
  return addDays(d, -((d.getDay() + 1) % 7));
}

function rateInRange(h: Habit, from: Date, to: Date): number {
  let due = 0;
  let done = 0;
  for (let d = new Date(from); toKey(d) <= toKey(to); d = addDays(d, 1)) {
    const k = toKey(d);
    if (k < h.createdAt) continue;
    if (!h.weekdays.includes(d.getDay())) continue;
    due++;
    if ((h.log[k] ?? 0) >= h.goal) done++;
  }
  return due === 0 ? 0 : Math.round((done / due) * 100);
}

function dayRate(habits: Habit[], d: Date): number {
  const due = habits.filter((h) => h.weekdays.includes(d.getDay()) && toKey(d) >= h.createdAt);
  if (due.length === 0) return 0;
  const sum = due.reduce((acc, h) => acc + Math.min(1, (h.log[toKey(d)] ?? 0) / h.goal), 0);
  return Math.round((sum / due.length) * 100);
}

/* ------------------------------ day ring cell ------------------------------ */

function DayRing({ pct, num, active, future }: { pct: number; num: number; active: boolean; future: boolean }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  return (
    <span className="relative grid h-10 w-10 place-items-center">
      <svg viewBox="0 0 36 36" className="absolute h-10 w-10 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        {!future && pct > 0 && (
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke={SKY}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            className="transition-all duration-500"
          />
        )}
      </svg>
      <span className={`text-xs font-bold ${active ? "text-sky-300" : future ? "text-slate-600" : "text-slate-200"}`}>
        {num}
      </span>
    </span>
  );
}

/* --------------------------------- screen --------------------------------- */

export default function HabitsScreen() {
  const { lang, t } = useI18n();
  const [habits, setHabits] = useState<Habit[]>(() => makeSeed(lang));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [statsMenu, setStatsMenu] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<StatPeriod | null>(null);

  const dShort = getDaysShort(lang);
  const selKey = toKey(selectedDate);
  const isFuture = selKey > tKey;

  const statLabel = (p: StatPeriod) =>
    p === "today"
      ? t("إحصائيات اليوم", "Today's stats")
      : p === "week"
        ? t("إحصائيات آخر أسبوع", "This week's stats")
        : t("إحصائيات آخر شهر", "This month's stats");

  const weekStrip = Array.from({ length: 7 }, (_, i) => addDays(weekStartSat(today), i));
  const dueHabits = habits.filter((h) => h.weekdays.includes(selectedDate.getDay()));

  const tick = (id: string) => {
    if (isFuture) return;
    navigator.vibrate?.(10);
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const cur = h.log[selKey] ?? 0;
        const next = cur >= h.goal ? 0 : cur + 1;
        return { ...h, log: { ...h.log, [selKey]: next } };
      })
    );
  };

  const addHabit = (data: Omit<Habit, "id" | "log" | "createdAt">) => {
    setHabits((prev) => [...prev, { ...data, id: `h${Date.now()}`, log: {}, createdAt: tKey }]);
    setAddOpen(false);
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setDetail(null);
  };

  const detailHabit = detail ? habits.find((h) => h.id === detail) : null;

  return (
    <div className="relative flex h-full flex-col">
      {/* ---------- header ---------- */}
      <header className="z-20 border-b border-white/5 bg-[#0c0e16]/95 px-4 pb-3 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          {/* stats menu button */}
          <div className="relative">
            <button
              onClick={() => setStatsMenu((s) => !s)}
              className={`grid h-11 w-11 place-items-center rounded-2xl border transition-colors ${
                statsMenu
                  ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
              aria-label={t("الإحصائيات", "Statistics")}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {statsMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setStatsMenu(false)} />
                <div className="float-in absolute start-0 top-12 z-40 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#161927] shadow-2xl shadow-black/60">
                  {(
                    [
                      { id: "today", emoji: "📊" },
                      { id: "week", emoji: "🗓️" },
                      { id: "month", emoji: "📅" },
                    ] as { id: StatPeriod; emoji: string }[]
                  ).map((o, i) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        setStatsMenu(false);
                        setStatsPeriod(o.id);
                      }}
                      className={`flex w-full items-center gap-2.5 px-4 py-3 text-start text-xs font-semibold text-slate-200 transition-colors hover:bg-white/5 ${
                        i > 0 ? "border-t border-white/5" : ""
                      }`}
                    >
                      <span className="text-base">{o.emoji}</span>
                      {statLabel(o.id)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* add habit button */}
          <button
            onClick={() => setAddOpen(true)}
            aria-label={t("إضافة عادة", "Add habit")}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-600/40 transition-transform active:scale-90"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        {/* week strip */}
        <div className="mt-3 grid grid-cols-7 gap-1">
          {weekStrip.map((d) => {
            const k = toKey(d);
            const isSel = isSameDay(d, selectedDate);
            const future = k > tKey;
            const pct = future ? 0 : dayRate(habits, d);
            return (
              <button
                key={k}
                onClick={() => !future && setSelectedDate(d)}
                disabled={future}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 transition-all ${
                  isSel ? "bg-sky-500/15 ring-1 ring-sky-500/40" : future ? "opacity-50" : "hover:bg-white/5"
                }`}
              >
                <span className="text-[9px] text-slate-500">{dShort[d.getDay()]}</span>
                <DayRing pct={pct} num={d.getDate()} active={isSel} future={future} />
              </button>
            );
          })}
        </div>
      </header>

      {/* ---------- habit list ---------- */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-32 pt-4">
        {dueHabits.length === 0 && (
          <div className="flex flex-col items-center pt-16 text-center">
            <span className="text-5xl">🌱</span>
            <p className="mt-3 text-sm font-semibold text-white">
              {t("لا توجد عادات لهذا اليوم", "No habits for this day")}
            </p>
            <p className="mt-1 text-xs text-slate-500">{t("أضف عادة جديدة بزر +", "Add a new habit with +")}</p>
          </div>
        )}

        {dueHabits.map((h) => {
          const count = h.log[selKey] ?? 0;
          const complete = count >= h.goal;
          const streak = calcStreak(h, today);
          const pct = Math.min(100, Math.round((count / h.goal) * 100));
          return (
            <div
              key={h.id}
              className={`overflow-hidden rounded-2xl border transition-all ${
                complete ? "" : "border-white/5 bg-white/[0.04]"
              }`}
              style={complete ? { background: `${SKY}1c`, borderColor: `${SKY}35` } : {}}
            >
              <div className="flex items-center gap-3 p-3">
                <button
                  onClick={() => setDetail(h.id)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
                  style={{ background: `${SKY}22` }}
                >
                  {h.emoji}
                </button>

                <button onClick={() => setDetail(h.id)} className="min-w-0 flex-1 text-start">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">{h.title}</span>
                    {streak > 1 && (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                        <FlameIcon className="h-2.5 w-2.5" />
                        {streak}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    {h.goal > 1
                      ? `${count}/${h.goal} ${h.unit}`
                      : complete
                        ? t("اكتملت اليوم ✓", "Completed today ✓")
                        : t("لم تكتمل بعد", "Not completed yet")}
                  </span>
                  {h.goal > 1 && (
                    <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, background: SKY }}
                      />
                    </span>
                  )}
                </button>

                <button
                  onClick={() => tick(h.id)}
                  disabled={isFuture}
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition-all active:scale-90 disabled:opacity-30 ${
                    complete ? "text-white" : "text-transparent"
                  }`}
                  style={{
                    borderColor: complete ? SKY : "rgba(255,255,255,0.15)",
                    background: complete ? SKY : "transparent",
                  }}
                >
                  {complete ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : h.goal > 1 && count > 0 ? (
                    <span className="text-[10px] font-bold" style={{ color: SKY }}>
                      +{count}
                    </span>
                  ) : (
                    <PlusIcon className="h-4 w-4 text-slate-500" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* sheets */}
      {addOpen && <AddHabitSheet onClose={() => setAddOpen(false)} onSave={addHabit} />}
      {detailHabit && (
        <HabitDetailSheet
          habit={detailHabit}
          onClose={() => setDetail(null)}
          onDelete={() => deleteHabit(detailHabit.id)}
        />
      )}
      {statsPeriod && (
        <StatsSheet
          period={statsPeriod}
          title={statLabel(statsPeriod)}
          habits={habits}
          onClose={() => setStatsPeriod(null)}
        />
      )}
    </div>
  );
}

/* -------------------------------- stats sheet ------------------------------ */

function StatsSheet({
  period,
  title,
  habits,
  onClose,
}: {
  period: StatPeriod;
  title: string;
  habits: Habit[];
  onClose: () => void;
}) {
  const { t } = useI18n();
  const from =
    period === "today"
      ? today
      : period === "week"
        ? weekStartSat(today)
        : new Date(today.getFullYear(), today.getMonth(), 1);

  const rows = habits.map((h) => {
    const rate =
      period === "today"
        ? h.weekdays.includes(today.getDay())
          ? Math.min(100, Math.round(((h.log[tKey] ?? 0) / h.goal) * 100))
          : -1
        : rateInRange(h, from, today);
    return { h, rate };
  });

  const valid = rows.filter((r) => r.rate >= 0);
  const avg = valid.length === 0 ? 0 : Math.round(valid.reduce((a, r) => a + r.rate, 0) / valid.length);

  const rangeLabel =
    period === "today"
      ? t("اليوم", "Today")
      : period === "week"
        ? t("من السبت حتى اليوم", "From Saturday until today")
        : t("من بداية الشهر حتى اليوم", "From the 1st until today");

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">{rangeLabel}</p>
        </div>
        <div className="text-end">
          <div className="text-2xl font-bold" style={{ color: SKY }}>
            {avg}%
          </div>
          <div className="text-[9px] text-slate-500">{t("المعدل العام", "Overall avg")}</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
        <div className="space-y-2.5">
          {rows.map(({ h, rate }) => (
            <div key={h.id} className="flex w-full items-center gap-2.5">
              <span className="text-base">{h.emoji}</span>
              <span className="w-24 truncate text-start text-[11px] text-slate-400">{h.title}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(rate, 0)}%`, background: SKY }}
                />
              </span>
              <span className="w-9 text-end text-[10px] font-bold" style={{ color: rate >= 0 ? SKY : "#475569" }}>
                {rate >= 0 ? `${rate}%` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

/* ------------------------------ add habit sheet ---------------------------- */

function AddHabitSheet({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (h: { title: string; emoji: string; goal: number; unit: string; weekdays: number[] }) => void;
}) {
  const { lang, t } = useI18n();
  const dShort = getDaysShort(lang);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [goal, setGoal] = useState(1);
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const toggleDay = (d: number) =>
    setWeekdays((prev) =>
      prev.includes(d) ? (prev.length > 1 ? prev.filter((x) => x !== d) : prev) : [...prev, d]
    );

  const dayOrder = [6, 0, 1, 2, 3, 4, 5];

  return (
    <Sheet onClose={onClose}>
      <h3 className="text-lg font-bold text-white">{t("عادة جديدة", "New habit")}</h3>

      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("مثال: المشي ٣٠ دقيقة…", "e.g. Walk 30 minutes…")}
        className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
      />

      <p className="mb-1.5 mt-4 text-[11px] font-bold text-slate-500">{t("الرمز", "Icon")}</p>
      <div className="flex flex-wrap gap-1.5">
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className={`grid h-9 w-9 place-items-center rounded-xl text-lg transition-all ${
              emoji === e ? "bg-sky-500/25 ring-2 ring-sky-500" : "bg-white/5"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <p className="mb-1.5 mt-4 text-[11px] font-bold text-slate-500">{t("المرات يومياً", "Times per day")}</p>
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-2 py-1.5">
        <button
          onClick={() => setGoal((g) => Math.max(1, g - 1))}
          className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-slate-300"
        >
          −
        </button>
        <span className="text-sm font-bold text-white">{goal}</span>
        <button
          onClick={() => setGoal((g) => Math.min(20, g + 1))}
          className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-slate-300"
        >
          +
        </button>
      </div>

      <p className="mb-1.5 mt-4 text-[11px] font-bold text-slate-500">{t("أيام التكرار", "Repeat days")}</p>
      <div className="grid grid-cols-7 gap-1.5">
        {dayOrder.map((d) => (
          <button
            key={d}
            onClick={() => toggleDay(d)}
            className={`rounded-xl py-2 text-[10px] font-bold transition-all ${
              weekdays.includes(d)
                ? "bg-sky-500 text-white"
                : "border border-white/10 bg-white/5 text-slate-500"
            }`}
          >
            {dShort[d]}
          </button>
        ))}
      </div>

      <button
        onClick={() =>
          onSave({
            title,
            emoji,
            goal,
            unit: goal > 1 ? t("مرات", "times") : t("مرة", "time"),
            weekdays,
          })
        }
        disabled={!title.trim()}
        className="mt-6 w-full rounded-2xl bg-gradient-to-l from-sky-500 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/30 transition-all active:scale-[0.98] disabled:opacity-40"
      >
        {t("إنشاء العادة", "Create habit")}
      </button>
    </Sheet>
  );
}

/* ----------------------------- habit detail sheet -------------------------- */

function HabitDetailSheet({
  habit: h,
  onClose,
  onDelete,
}: {
  habit: Habit;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const streak = calcStreak(h, today);
  const best = bestStreak(h);
  const rate30 = rateInRange(h, addDays(today, -29), today);
  const totalDone = Object.values(h.log).filter((v) => v >= h.goal).length;

  const weeks: Date[][] = [];
  let cursor = weekStartSat(today);
  cursor = addDays(cursor, -63);
  for (let w = 0; w < 10; w++) {
    const col: Date[] = [];
    for (let i = 0; i < 7; i++) col.push(addDays(cursor, w * 7 + i));
    weeks.push(col);
  }

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center gap-3">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
          style={{ background: `${SKY}22` }}
        >
          {h.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-white">{h.title}</h3>
          <p className="text-[11px] text-slate-500">
            {h.goal > 1
              ? `${h.goal} ${h.unit} ${t("يومياً", "daily")}`
              : t("مرة يومياً", "Once daily")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { v: streak, l: t("السلسلة", "Streak"), c: "#fbbf24", flame: true },
          { v: best, l: t("أفضل سلسلة", "Best streak"), c: "#fb923c" },
          { v: `${rate30}%`, l: t("آخر ٣٠ يوم", "Last 30 days"), c: SKY },
          { v: totalDone, l: t("إجمالي الأيام", "Total days"), c: "#34d399" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-white/5 bg-white/[0.03] py-2.5 text-center">
            <div className="flex items-center justify-center gap-0.5 text-base font-bold" style={{ color: s.c }}>
              {s.flame && <FlameIcon className="h-3.5 w-3.5" />}
              {s.v}
            </div>
            <div className="mt-0.5 text-[9px] text-slate-500">{s.l}</div>
          </div>
        ))}
      </div>

      <p className="mb-2 mt-4 text-[11px] font-bold text-slate-500">{t("آخر ١٠ أسابيع", "Last 10 weeks")}</p>
      <div className="flex justify-between gap-1">
        {weeks.map((col, wi) => (
          <div key={wi} className="flex flex-1 flex-col gap-1">
            {col.map((d) => {
              const k = toKey(d);
              const future = k > tKey;
              const due = h.weekdays.includes(d.getDay()) && k >= h.createdAt;
              const v = h.log[k] ?? 0;
              const full = v >= h.goal;
              const partial = v > 0 && !full;
              return (
                <span
                  key={k}
                  title={k}
                  className="aspect-square w-full rounded-[4px]"
                  style={{
                    background: future
                      ? "transparent"
                      : full
                        ? SKY
                        : partial
                          ? `${SKY}55`
                          : due
                            ? "rgba(255,255,255,0.07)"
                            : "rgba(255,255,255,0.025)",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <button
        onClick={onDelete}
        className="mt-6 w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 py-3 text-sm font-bold text-rose-400 transition-all active:scale-[0.98]"
      >
        {t("حذف العادة", "Delete habit")}
      </button>
    </Sheet>
  );
}

/* ------------------------------ sheet wrapper ------------------------------ */

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="float-in relative max-h-[88%] w-full overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#11131e] p-5 pb-8 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
        {children}
      </div>
    </div>
  );
}
