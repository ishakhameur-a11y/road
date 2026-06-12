import { useMemo, useState } from "react";
import { addDays, getMonths, getMonthGrid, toKey, type Lng } from "../utils/dates";
import { CheckIcon, PlusIcon, FlameIcon } from "../components/Icons";
import { useI18n } from "../i18n";

/* ---------------------------------- types --------------------------------- */

interface Milestone {
  id: string;
  title: string;
  done: boolean;
}

interface Goal {
  id: string;
  title: string;
  emoji: string;
  deadline: string | null;
  milestones: Milestone[];
}

type Filter = "active" | "done" | "all";

const SKY = "#38bdf8";
const EMOJIS = ["🎯", "📚", "💰", "🏋️", "🚀", "🧠", "🌍", "💼", "🏡", "❤️", "🎓", "✈️"];

/* ---------------------------------- seed ---------------------------------- */

const today = new Date();

function makeSeed(lang: Lng): Goal[] {
  const T = (ar: string, en: string) => (lang === "ar" ? ar : en);
  return [
    {
      id: "g1",
      title: T("قراءة ١٢ كتاباً هذه السنة", "Read 12 books this year"),
      emoji: "📚",
      deadline: toKey(addDays(today, 200)),
      milestones: [
        { id: "m1", title: T("العادات الذرية", "Atomic Habits"), done: true },
        { id: "m2", title: T("فكر تصبح غنياً", "Think and Grow Rich"), done: true },
        { id: "m3", title: T("قوة العادات", "The Power of Habit"), done: true },
        { id: "m4", title: T("الأب الغني والأب الفقير", "Rich Dad Poor Dad"), done: true },
        { id: "m5", title: T("ابدأ بالأهم", "First Things First"), done: false },
        { id: "m6", title: T("العمل العميق", "Deep Work"), done: false },
      ],
    },
    {
      id: "g2",
      title: T("ادخار ٢٠ ألف ريال", "Save 20K SAR"),
      emoji: "💰",
      deadline: toKey(addDays(today, 120)),
      milestones: [
        { id: "m7", title: T("٥ آلاف", "5K"), done: true },
        { id: "m8", title: T("١٠ آلاف", "10K"), done: true },
        { id: "m9", title: T("١٥ ألف", "15K"), done: false },
        { id: "m10", title: T("٢٠ ألف", "20K"), done: false },
      ],
    },
    {
      id: "g3",
      title: T("إنقاص الوزن ٨ كيلو", "Lose 8 kg"),
      emoji: "🏋️",
      deadline: toKey(addDays(today, 60)),
      milestones: [
        { id: "m11", title: T("أول ٢ كيلو", "First 2 kg"), done: true },
        { id: "m12", title: T("٤ كيلو", "4 kg"), done: false },
        { id: "m13", title: T("٦ كيلو", "6 kg"), done: false },
        { id: "m14", title: T("٨ كيلو 🎉", "8 kg 🎉"), done: false },
      ],
    },
    {
      id: "g4",
      title: T("تعلم أساسيات البرمجة", "Learn programming basics"),
      emoji: "🧠",
      deadline: null,
      milestones: [
        { id: "m15", title: T("أساسيات HTML & CSS", "HTML & CSS basics"), done: true },
        { id: "m16", title: "JavaScript", done: true },
        { id: "m17", title: T("بناء مشروع كامل", "Build a full project"), done: true },
      ],
    },
  ];
}

/* --------------------------------- helpers -------------------------------- */

function progressOf(g: Goal): number {
  if (g.milestones.length === 0) return 0;
  return Math.round((g.milestones.filter((m) => m.done).length / g.milestones.length) * 100);
}

/* --------------------------------- screen --------------------------------- */

export default function GoalsScreen() {
  const { lang, t } = useI18n();
  const [goals, setGoals] = useState<Goal[]>(() => makeSeed(lang));
  const [filter, setFilter] = useState<Filter>("active");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  const mNames = getMonths(lang);

  const deadlineInfo = (deadline: string | null): { label: string; urgent: boolean } | null => {
    if (!deadline) return null;
    const [y, m, d] = deadline.split("-").map(Number);
    const dl = new Date(y, m - 1, d);
    const diff = Math.ceil((dl.getTime() - today.getTime()) / 86_400_000);
    if (diff < 0) return { label: t("انتهى الموعد", "Deadline passed"), urgent: true };
    if (diff === 0) return { label: t("ينتهي اليوم!", "Due today!"), urgent: true };
    if (diff <= 14) return { label: t(`باقي ${diff} يوم`, `${diff} days left`), urgent: true };
    if (diff <= 60)
      return {
        label: t(`باقي ${Math.round(diff / 7)} أسابيع`, `${Math.round(diff / 7)} weeks left`),
        urgent: false,
      };
    return { label: `${d} ${mNames[m - 1]} ${y}`, urgent: false };
  };

  const sorted = useMemo(
    () =>
      [...goals].sort((a, b) => (a.deadline ?? "9999-99-99").localeCompare(b.deadline ?? "9999-99-99")),
    [goals]
  );

  const withProgress = sorted.map((g) => ({ g, p: progressOf(g) }));
  const activeGoals = withProgress.filter((x) => x.p < 100);
  const doneGoals = withProgress.filter((x) => x.p >= 100);

  const filtered =
    filter === "active" ? activeGoals : filter === "done" ? doneGoals : withProgress;

  const overall =
    withProgress.length === 0
      ? 0
      : Math.round(withProgress.reduce((a, x) => a + x.p, 0) / withProgress.length);

  const toggleMilestone = (goalId: string, msId: string) => {
    navigator.vibrate?.(10);
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, milestones: g.milestones.map((m) => (m.id === msId ? { ...m, done: !m.done } : m)) }
          : g
      )
    );
  };

  const addGoal = (data: { title: string; emoji: string; deadline: string | null; milestones: { id?: string; title: string }[] }) => {
    setGoals((prev) => [
      {
        id: `g${Date.now()}`,
        title: data.title,
        emoji: data.emoji,
        deadline: data.deadline,
        milestones: data.milestones.map((m, i) => ({ id: `m${Date.now()}-${i}`, title: m.title, done: false })),
      },
      ...prev,
    ]);
    setAddOpen(false);
  };

  const saveEdit = (id: string, data: { title: string; emoji: string; deadline: string | null; milestones: { id?: string; title: string }[] }) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        return {
          ...g,
          title: data.title,
          emoji: data.emoji,
          deadline: data.deadline,
          milestones: data.milestones.map((m, i) => {
            const old = m.id ? g.milestones.find((x) => x.id === m.id) : undefined;
            return { id: m.id ?? `m${Date.now()}-${i}`, title: m.title, done: old?.done ?? false };
          }),
        };
      })
    );
    setEditGoal(null);
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setExpanded(null);
  };

  return (
    <div className="relative flex h-full flex-col">
      {/* ---------- header ---------- */}
      <header className="z-20 border-b border-white/5 bg-[#0c0e16]/95 px-4 pb-3 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative grid h-12 w-12 place-items-center">
              <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke={SKY}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 * (1 - overall / 100)}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-white">{overall}%</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {t(
                  `${doneGoals.length} من ${goals.length} أهداف مكتملة`,
                  `${doneGoals.length} of ${goals.length} goals achieved`
                )}
              </p>
              <p className="text-[10px] text-slate-500">
                {t("واصل التقدم نحو أحلامك 🎯", "Keep moving toward your dreams 🎯")}
              </p>
            </div>
          </div>

          <button
            onClick={() => setAddOpen(true)}
            aria-label={t("إضافة هدف", "Add goal")}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-600/40 transition-transform active:scale-90"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        {/* filter chips */}
        <div className="mt-3 flex gap-2">
          {(
            [
              { id: "active", label: t("قيد التنفيذ", "Active"), count: activeGoals.length },
              { id: "done", label: t("مكتملة", "Done"), count: doneGoals.length },
              { id: "all", label: t("الكل", "All"), count: goals.length },
            ] as { id: Filter; label: string; count: number }[]
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all ${
                filter === f.id
                  ? "bg-violet-500 text-white shadow shadow-violet-600/30"
                  : "border border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              {f.label}
              <span className={`text-[9px] ${filter === f.id ? "text-white/80" : "text-slate-500"}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* ---------- goals list ---------- */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-32 pt-4">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center pt-16 text-center">
            <span className="text-5xl">🎯</span>
            <p className="mt-3 text-sm font-semibold text-white">
              {filter === "done"
                ? t("لا توجد أهداف مكتملة بعد", "No completed goals yet")
                : t("لا توجد أهداف هنا", "No goals here")}
            </p>
            <p className="mt-1 text-xs text-slate-500">{t("أضف هدفاً جديداً بزر +", "Add a new goal with +")}</p>
          </div>
        )}

        {filtered.map(({ g, p }) => {
          const isOpen = expanded === g.id;
          const dl = deadlineInfo(g.deadline);
          const complete = p >= 100;
          const doneMs = g.milestones.filter((m) => m.done).length;
          return (
            <div
              key={g.id}
              className={`overflow-hidden rounded-2xl border transition-all ${
                complete ? "" : "border-white/5 bg-white/[0.04]"
              }`}
              style={complete ? { background: `${SKY}14`, borderColor: `${SKY}35` } : {}}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : g.id)}
                className="flex w-full items-center gap-3 p-3.5 text-start"
              >
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
                  style={{ background: `${SKY}22` }}
                >
                  {g.emoji}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-white">{g.title}</span>
                    {complete && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                        style={{ background: SKY }}
                      >
                        {t("✓ تحقق", "✓ Achieved")}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                    <span>
                      {doneMs}/{g.milestones.length} {t("مراحل", "milestones")}
                    </span>
                    {dl && !complete && (
                      <span className={`flex items-center gap-0.5 ${dl.urgent ? "text-rose-400" : ""}`}>
                        {dl.urgent && <FlameIcon className="h-2.5 w-2.5" />}
                        {dl.label}
                      </span>
                    )}
                  </span>
                  <span className="mt-2 flex items-center gap-2">
                    <span className="block h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full transition-all duration-500"
                        style={{ width: `${p}%`, background: SKY }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-end text-[10px] font-bold" style={{ color: SKY }}>
                      {p}%
                    </span>
                  </span>
                </span>

                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-white/5 px-3.5 pb-3.5 pt-2.5">
                  <div className="space-y-1.5">
                    {g.milestones.map((m, i) => (
                      <button
                        key={m.id}
                        onClick={() => toggleMilestone(g.id, m.id)}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start transition-colors hover:bg-white/5"
                      >
                        <span className="relative flex flex-col items-center">
                          <span
                            className={`grid h-6 w-6 place-items-center rounded-full border-2 transition-all ${
                              m.done ? "text-white" : "text-transparent"
                            }`}
                            style={{
                              borderColor: m.done ? SKY : "rgba(255,255,255,0.15)",
                              background: m.done ? SKY : "transparent",
                            }}
                          >
                            <CheckIcon className="h-3 w-3" />
                          </span>
                          {i < g.milestones.length - 1 && (
                            <span
                              className="absolute top-6 h-3 w-0.5"
                              style={{ background: m.done ? `${SKY}66` : "rgba(255,255,255,0.08)" }}
                            />
                          )}
                        </span>
                        <span
                          className={`flex-1 truncate text-xs ${
                            m.done ? "text-slate-500 line-through" : "text-slate-300"
                          }`}
                        >
                          {m.title}
                        </span>
                        <span className="text-[9px] text-slate-600">
                          {t(`المرحلة ${i + 1}`, `Step ${i + 1}`)}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="flex-1 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2 text-[11px] font-bold text-rose-400 transition-all active:scale-[0.98]"
                    >
                      {t("حذف الهدف", "Delete goal")}
                    </button>
                    <button
                      onClick={() => setEditGoal(g)}
                      aria-label={t("تعديل الهدف", "Edit goal")}
                      className="grid w-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all hover:bg-white/10 active:scale-[0.95]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* sheets */}
      {addOpen && <GoalFormSheet onClose={() => setAddOpen(false)} onSave={addGoal} />}
      {editGoal && (
        <GoalFormSheet
          initial={editGoal}
          onClose={() => setEditGoal(null)}
          onSave={(d) => saveEdit(editGoal.id, d)}
        />
      )}
    </div>
  );
}

/* --------------------------- goal form sheet (add/edit) -------------------- */

function GoalFormSheet({
  initial,
  onClose,
  onSave,
}: {
  initial?: Goal;
  onClose: () => void;
  onSave: (g: { title: string; emoji: string; deadline: string | null; milestones: { id?: string; title: string }[] }) => void;
}) {
  const { lang, t } = useI18n();
  const mNames = getMonths(lang);
  const calLetters =
    lang === "ar" ? ["س", "ح", "ن", "ث", "ر", "خ", "ج"] : ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];

  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? EMOJIS[0]);
  const [deadline, setDeadline] = useState<string | null>(initial ? initial.deadline : null);
  const [milestones, setMilestones] = useState<{ id?: string; title: string }[]>(
    initial ? initial.milestones.map((m) => ({ id: m.id, title: m.title })) : []
  );
  const [msInput, setMsInput] = useState("");

  const initialCal = useMemo(() => {
    if (initial?.deadline) {
      const [y, m] = initial.deadline.split("-").map(Number);
      return { y, m: m - 1 };
    }
    return { y: today.getFullYear(), m: today.getMonth() };
  }, [initial]);
  const [calMonth, setCalMonth] = useState(initialCal);
  const calGrid = getMonthGrid(calMonth.y, calMonth.m);
  const tK = toKey(today);

  const addMs = () => {
    if (!msInput.trim()) return;
    setMilestones((prev) => [...prev, { title: msInput.trim() }]);
    setMsInput("");
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="float-in relative max-h-[88%] w-full overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#11131e] p-5 pb-8 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
        <h3 className="text-lg font-bold text-white">
          {isEdit ? t("تعديل الهدف", "Edit goal") : t("هدف جديد", "New goal")}
        </h3>

        <input
          autoFocus={!isEdit}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("مثال: تعلم لغة جديدة…", "e.g. Learn a new language…")}
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
        />

        {/* emoji */}
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

        {/* deadline calendar */}
        <div className="mb-1.5 mt-4 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-500">{t("الموعد النهائي", "Deadline")}</p>
          {deadline ? (
            <button
              onClick={() => setDeadline(null)}
              className="rounded-full bg-sky-500/15 px-2.5 py-1 text-[10px] font-semibold text-sky-300"
            >
              {(() => {
                const [, m, d] = deadline.split("-").map(Number);
                return `${d} ${mNames[m - 1]} ✕`;
              })()}
            </button>
          ) : (
            <span className="text-[10px] text-slate-600">{t("بدون موعد", "No deadline")}</span>
          )}
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              onClick={() => setCalMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white/5"
            >
              <svg viewBox="0 0 24 24" className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-white">
              {mNames[calMonth.m]} {calMonth.y}
            </span>
            <button
              onClick={() => setCalMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white/5"
            >
              <svg viewBox="0 0 24 24" className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {calLetters.map((d, i) => (
              <span key={i} className="py-1 text-center text-[10px] text-slate-500">
                {d}
              </span>
            ))}
            {calGrid.flat().map((d, i) => {
              const k = toKey(d);
              const inMonth = d.getMonth() === calMonth.m;
              const isSel = deadline === k;
              const isToday = k === tK;
              const past = k < tK;
              return (
                <button
                  key={i}
                  onClick={() => !past && setDeadline(isSel ? null : k)}
                  disabled={past}
                  className="flex justify-center py-0.5"
                >
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs transition-all ${
                      isSel
                        ? "bg-sky-500 font-bold text-white"
                        : past
                          ? "text-slate-700"
                          : isToday
                            ? "font-bold text-sky-400 ring-1 ring-sky-500/50"
                            : inMonth
                              ? "text-slate-300 hover:bg-white/10"
                              : "text-slate-600"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* milestones */}
        <p className="mb-1.5 mt-4 text-[11px] font-bold text-slate-500">
          {t("المراحل", "Milestones")} {milestones.length > 0 && `(${milestones.length})`}
        </p>
        <div className="space-y-1.5">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
              <span
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white"
                style={{ background: SKY }}
              >
                {i + 1}
              </span>
              <span className="flex-1 truncate text-xs text-slate-300">{m.title}</span>
              <button
                onClick={() => setMilestones((prev) => prev.filter((_, x) => x !== i))}
                className="px-1 text-slate-600 hover:text-rose-400"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 py-1.5 pe-3 ps-1.5">
            <button
              onClick={addMs}
              disabled={!msInput.trim()}
              aria-label={t("إضافة مرحلة", "Add milestone")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-500/20 text-sky-300 transition-all active:scale-90 disabled:bg-white/5 disabled:text-slate-600"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
            <input
              value={msInput}
              onChange={(e) => setMsInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMs()}
              placeholder={t("إضافة مرحلة…", "Add a milestone…")}
              className="min-w-0 flex-1 bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={() => onSave({ title, emoji, deadline, milestones })}
          disabled={!title.trim() || milestones.length === 0}
          className="mt-6 w-full rounded-2xl bg-gradient-to-l from-sky-500 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/30 transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {isEdit ? t("حفظ التعديلات", "Save changes") : t("إنشاء الهدف", "Create goal")}
        </button>
        {milestones.length === 0 && (
          <p className="mt-2 text-center text-[10px] text-slate-600">
            {t("أضف مرحلة واحدة على الأقل لقياس التقدم", "Add at least one milestone to track progress")}
          </p>
        )}
      </div>
    </div>
  );
}
