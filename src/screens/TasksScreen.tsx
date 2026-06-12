import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  formatFullDate,
  getDaysShort,
  getMonths,
  getMonthGrid,
  hourLabel,
  isSameDay,
  minutesToLabel,
  startOfWeek,
  toKey,
  type Lng,
} from "../utils/dates";
import { PlusIcon } from "../components/Icons";
import { useI18n } from "../i18n";

/* ---------------------------------- types --------------------------------- */

type Status = "pending" | "done" | "postponed" | "missed";

interface CalEvent {
  id: string;
  title: string;
  dateKey: string;
  start: number;
  end: number;
  status: Status;
}

type ViewMode = "day" | "week" | "month";

const HOUR = 56;
const SNAP = 15;

const STATUS_COLOR: Record<Status, string> = {
  pending: "#0ea5e9",
  done: "#22c55e",
  postponed: "#f59e0b",
  missed: "#ef4444",
};

function statusLabel(s: Status, t: (a: string, e: string) => string): string {
  switch (s) {
    case "pending":
      return t("قيد التنفيذ", "In progress");
    case "done":
      return t("منجزة", "Done");
    case "postponed":
      return t("مؤجلة", "Postponed");
    case "missed":
      return t("فائتة", "Missed");
  }
}

/* ------------------------------- seed events ------------------------------ */

const today = new Date();

function makeSeed(lang: Lng): CalEvent[] {
  const T = (ar: string, en: string) => (lang === "ar" ? ar : en);
  return [
    { id: "e1", title: T("اجتماع فريق التصميم", "Design team meeting"), dateKey: toKey(today), start: 9 * 60, end: 10 * 60 + 30, status: "done" },
    { id: "e2", title: T("مراجعة خطة المشروع", "Review project plan"), dateKey: toKey(today), start: 11 * 60, end: 12 * 60, status: "pending" },
    { id: "e3", title: T("غداء مع أحمد", "Lunch with Ahmed"), dateKey: toKey(today), start: 13 * 60, end: 14 * 60, status: "pending" },
    { id: "e4", title: T("تمارين رياضية", "Workout"), dateKey: toKey(today), start: 18 * 60 + 30, end: 19 * 60 + 30, status: "pending" },
    { id: "e5", title: T("قراءة — العادات الذرية", "Reading — Atomic Habits"), dateKey: toKey(today), start: 21 * 60, end: 22 * 60, status: "pending" },
    { id: "e6", title: T("مكالمة مع العميل", "Client call"), dateKey: toKey(addDays(today, 1)), start: 10 * 60, end: 11 * 60, status: "pending" },
    { id: "e7", title: T("تسليم التقرير الشهري", "Submit monthly report"), dateKey: toKey(addDays(today, 1)), start: 14 * 60, end: 15 * 60 + 30, status: "postponed" },
    { id: "e8", title: T("موعد طبيب الأسنان", "Dentist appointment"), dateKey: toKey(addDays(today, -1)), start: 16 * 60 + 30, end: 17 * 60 + 30, status: "missed" },
    { id: "e9", title: T("تخطيط الأسبوع القادم", "Plan next week"), dateKey: toKey(addDays(today, 3)), start: 9 * 60, end: 10 * 60, status: "pending" },
    { id: "e10", title: T("عشاء عائلي", "Family dinner"), dateKey: toKey(addDays(today, 4)), start: 20 * 60, end: 21 * 60 + 30, status: "pending" },
  ];
}

/* ------------------------------ overlap layout ----------------------------- */

function layoutDay(events: CalEvent[]) {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end);
  const colEnds: number[] = [];
  const placed = sorted.map((e) => {
    let col = colEnds.findIndex((end) => end <= e.start);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(e.end);
    } else {
      colEnds[col] = e.end;
    }
    return { event: e, col };
  });
  return placed.map((p) => ({ ...p, total: colEnds.length }));
}

/* ------------------------------ gesture types ------------------------------ */

interface Gesture {
  id: string;
  mode: "press" | "scroll" | "move" | "resize";
  longPressFired: boolean;
  startX: number;
  startY: number;
  lastY: number;
  origStart: number;
  origEnd: number;
  origDayIdx: number;
  colWidth: number;
  timer: number | null;
}

interface Preview {
  id: string;
  start: number;
  end: number;
  dayIdx: number;
}

/* --------------------------------- screen --------------------------------- */

export default function TasksScreen() {
  const { lang, t } = useI18n();
  const [events, setEvents] = useState<CalEvent[]>(() => makeSeed(lang));
  const [selected, setSelected] = useState<Date>(new Date());
  const [view, setView] = useState<ViewMode>("day");
  const [monthOpen, setMonthOpen] = useState(false);
  const [gridMonth, setGridMonth] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [now, setNow] = useState(new Date());
  const [addSheet, setAddSheet] = useState<{ dateKey: string; start: number } | null>(null);
  const [statusSheet, setStatusSheet] = useState<CalEvent | null>(null);
  const [editSheet, setEditSheet] = useState<CalEvent | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);

  const mNames = getMonths(lang);
  const dShort = getDaysShort(lang);
  const calLetters =
    lang === "ar" ? ["س", "ح", "ن", "ث", "ر", "خ", "ج"] : ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];
  const mtl = (m: number) => minutesToLabel(m, lang);

  useEffect(() => {
    const tm = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(tm);
  }, []);

  useEffect(() => {
    if (view === "month") return;
    const h = isSameDay(selected, new Date()) ? Math.max(new Date().getHours() - 1.5, 0) : 7.5;
    scrollRef.current?.scrollTo({ top: h * HOUR });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const eventsByKey = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const arr = map.get(e.dateKey) ?? [];
      arr.push(e);
      map.set(e.dateKey, arr);
    }
    return map;
  }, [events]);

  const weekStart = startOfWeek(selected);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const visibleDays = view === "week" ? weekDates : [selected];

  const pickDate = (d: Date) => {
    setSelected(d);
    setGridMonth({ y: d.getFullYear(), m: d.getMonth() });
    setMonthOpen(false);
  };

  const saveEvent = (title: string, start: number, duration: number) => {
    if (!addSheet || !title.trim()) return;
    setEvents((prev) => [
      ...prev,
      {
        id: `e${Date.now()}`,
        title: title.trim(),
        dateKey: addSheet.dateKey,
        start,
        end: Math.min(start + duration, 24 * 60),
        status: "pending",
      },
    ]);
    setAddSheet(null);
  };

  const updateEvent = (id: string, title: string, start: number, duration: number) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, title: title.trim(), start, end: Math.min(start + duration, 24 * 60) } : e
      )
    );
    setEditSheet(null);
  };

  const setStatus = (id: string, status: Status) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: e.status === status ? "pending" : status } : e))
    );
    setStatusSheet(null);
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setEditSheet(null);
    setStatusSheet(null);
  };

  /* ------------------------- drag / long-press logic ------------------------ */

  const clearGesture = () => {
    const g = gestureRef.current;
    if (g?.timer) window.clearTimeout(g.timer);
    gestureRef.current = null;
  };

  const onEventPointerDown = (ev: React.PointerEvent, e: CalEvent, dayIdx: number) => {
    if (view === "month") return;
    (ev.currentTarget as Element).setPointerCapture(ev.pointerId);
    const colWidth =
      (ev.currentTarget as HTMLElement).parentElement?.getBoundingClientRect().width ?? 300;

    const isActive = activeId === e.id;
    const g: Gesture = {
      id: e.id,
      mode: isActive ? "move" : "press",
      longPressFired: false,
      startX: ev.clientX,
      startY: ev.clientY,
      lastY: ev.clientY,
      origStart: e.start,
      origEnd: e.end,
      origDayIdx: dayIdx,
      colWidth,
      timer: null,
    };
    if (!isActive) {
      g.timer = window.setTimeout(() => {
        g.mode = "move";
        g.longPressFired = true;
        g.timer = null;
        setActiveId(e.id);
        navigator.vibrate?.(15);
      }, 380);
    }
    gestureRef.current = g;
  };

  const onResizePointerDown = (ev: React.PointerEvent, e: CalEvent, dayIdx: number) => {
    ev.stopPropagation();
    (ev.currentTarget as Element).setPointerCapture(ev.pointerId);
    gestureRef.current = {
      id: e.id,
      mode: "resize",
      longPressFired: true,
      startX: ev.clientX,
      startY: ev.clientY,
      lastY: ev.clientY,
      origStart: e.start,
      origEnd: e.end,
      origDayIdx: dayIdx,
      colWidth: 300,
      timer: null,
    };
  };

  const onEventPointerMove = (ev: React.PointerEvent) => {
    const g = gestureRef.current;
    if (!g) return;
    const dx = ev.clientX - g.startX;
    const dy = ev.clientY - g.startY;

    if (g.mode === "press") {
      if (Math.hypot(dx, dy) > 8) {
        if (g.timer) window.clearTimeout(g.timer);
        g.timer = null;
        g.mode = "scroll";
        g.lastY = ev.clientY;
      }
      return;
    }

    if (g.mode === "scroll") {
      if (scrollRef.current) scrollRef.current.scrollTop -= ev.clientY - g.lastY;
      g.lastY = ev.clientY;
      return;
    }

    const deltaMin = Math.round(((dy / HOUR) * 60) / SNAP) * SNAP;

    if (g.mode === "move") {
      const dur = g.origEnd - g.origStart;
      const newStart = Math.min(Math.max(g.origStart + deltaMin, 0), 24 * 60 - dur);
      const dirFactor = lang === "ar" ? -1 : 1;
      const shift = view === "week" ? Math.round((dirFactor * dx) / g.colWidth) : 0;
      const newIdx = Math.min(Math.max(g.origDayIdx + shift, 0), visibleDays.length - 1);
      setPreview({ id: g.id, start: newStart, end: newStart + dur, dayIdx: newIdx });
    } else if (g.mode === "resize") {
      const newEnd = Math.min(Math.max(g.origEnd + deltaMin, g.origStart + SNAP), 24 * 60);
      setPreview({ id: g.id, start: g.origStart, end: newEnd, dayIdx: g.origDayIdx });
    }
  };

  const onEventPointerUp = (e: CalEvent) => {
    const g = gestureRef.current;
    if (!g) return;

    if (g.mode === "press") {
      clearGesture();
      setStatusSheet(e);
      return;
    }

    if ((g.mode === "move" || g.mode === "resize") && preview && preview.id === g.id) {
      const targetDate = visibleDays[preview.dayIdx] ?? selected;
      setEvents((prev) =>
        prev.map((x) =>
          x.id === g.id
            ? { ...x, start: preview.start, end: preview.end, dateKey: toKey(targetDate) }
            : x
        )
      );
      setActiveId(g.id);
    } else if (g.mode === "move" && !g.longPressFired) {
      setStatusSheet(e);
    }
    setPreview(null);
    clearGesture();
  };

  const onEventPointerCancel = () => {
    setPreview(null);
    clearGesture();
  };

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const monthGrid = getMonthGrid(gridMonth.y, gridMonth.m);
  const headerDate = view === "month" ? new Date(gridMonth.y, gridMonth.m, 1) : selected;

  /* -------------------------------- render -------------------------------- */

  return (
    <div className="relative flex h-full flex-col">
      {/* ---------- header ---------- */}
      <header className="z-20 border-b border-white/5 bg-[#0c0e16]/95 px-4 pb-2 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => view !== "month" && setMonthOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5"
          >
            <h1 className="text-lg font-bold text-white">
              {mNames[headerDate.getMonth()]}{" "}
              <span className="font-normal text-slate-400">{headerDate.getFullYear()}</span>
            </h1>
            {view !== "month" && (
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 text-slate-400 transition-transform ${monthOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
          </button>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-0.5">
              {(
                [
                  { id: "day", label: t("يوم", "Day") },
                  { id: "week", label: t("أسبوع", "Week") },
                  { id: "month", label: t("شهر", "Month") },
                ] as { id: ViewMode; label: string }[]
              ).map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setView(v.id);
                    setActiveId(null);
                    setMonthOpen(false);
                  }}
                  className={`rounded-[10px] px-2.5 py-1 text-[11px] font-medium transition-all ${
                    view === v.id ? "bg-violet-500 text-white shadow" : "text-slate-400"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <button
              onClick={() =>
                setAddSheet({
                  dateKey: toKey(selected),
                  start: Math.min((new Date().getHours() + 1) * 60, 23 * 60),
                })
              }
              aria-label={t("إضافة مهمة", "Add task")}
              className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-600/40 transition-transform active:scale-90"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* mini month (day/week only) */}
        {monthOpen && view !== "month" && (
          <div className="float-in mt-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center justify-between">
              <button
                onClick={() => setGridMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white/5"
              >
                <svg viewBox="0 0 24 24" className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-white">
                {mNames[gridMonth.m]} {gridMonth.y}
              </span>
              <button
                onClick={() => setGridMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white/5"
              >
                <svg viewBox="0 0 24 24" className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {calLetters.map((d, i) => (
                <span key={i} className="py-1 text-center text-[10px] text-slate-500">{d}</span>
              ))}
              {monthGrid.flat().map((d, i) => {
                const inMonth = d.getMonth() === gridMonth.m;
                const isSel = isSameDay(d, selected);
                const isToday = isSameDay(d, new Date());
                const hasEvents = (eventsByKey.get(toKey(d))?.length ?? 0) > 0;
                return (
                  <button key={i} onClick={() => pickDate(d)} className="flex flex-col items-center py-0.5">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full text-xs transition-all ${
                        isSel
                          ? "bg-violet-500 font-bold text-white"
                          : isToday
                            ? "font-bold text-violet-400 ring-1 ring-violet-500/50"
                            : inMonth
                              ? "text-slate-300 hover:bg-white/10"
                              : "text-slate-600"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    <span className={`mt-px h-1 w-1 rounded-full ${hasEvents && !isSel ? "bg-violet-400/70" : "bg-transparent"}`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* week strip (day view only) */}
        {!monthOpen && view === "day" && (
          <div className="mt-2 flex">
            <div className="w-12 shrink-0" />
            <div className="grid flex-1 grid-cols-7">
              {weekDates.map((d) => {
                const isSel = isSameDay(d, selected);
                const isToday = isSameDay(d, new Date());
                const hasEvents = (eventsByKey.get(toKey(d))?.length ?? 0) > 0;
                return (
                  <button key={toKey(d)} onClick={() => setSelected(d)} className="flex flex-col items-center gap-1 py-1">
                    <span className="text-[9px] text-slate-500">{dShort[d.getDay()]}</span>
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-full text-sm transition-all ${
                        isSel
                          ? "bg-violet-500 font-bold text-white shadow-lg shadow-violet-600/40"
                          : isToday
                            ? "font-bold text-violet-400"
                            : "text-slate-300"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    <span className={`h-1 w-1 rounded-full ${hasEvents && !isSel ? "bg-violet-400/70" : "bg-transparent"}`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ---------- body ---------- */}
      {view === "month" ? (
        <MonthView
          grid={monthGrid}
          month={gridMonth}
          setMonth={setGridMonth}
          selected={selected}
          onSelect={(d) => setSelected(d)}
          eventsByKey={eventsByKey}
          onPickEvent={(e) => setStatusSheet(e)}
          onAdd={(key) => setAddSheet({ dateKey: key, start: 9 * 60 })}
        />
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          {view === "week" && (
            <div className="sticky top-0 z-10 flex border-b border-white/5 bg-[#0c0e16]/95 backdrop-blur">
              <div className="w-9 shrink-0" />
              {visibleDays.map((d) => {
                const isToday = isSameDay(d, new Date());
                const isSel = isSameDay(d, selected);
                return (
                  <button
                    key={toKey(d)}
                    onClick={() => setSelected(d)}
                    className="flex flex-1 flex-col items-center py-1.5"
                  >
                    <span className="text-[8px] text-slate-500">{dShort[d.getDay()]}</span>
                    <span
                      className={`mt-0.5 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${
                        isToday
                          ? "bg-violet-500 text-white"
                          : isSel
                            ? "text-violet-400 ring-1 ring-violet-500/40"
                            : "text-slate-300"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="relative flex" style={{ height: 24 * HOUR + 20 }}>
            <div className={`relative shrink-0 ${view === "week" ? "w-9" : "w-12"}`}>
              {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
                <span
                  key={h}
                  className="absolute end-1 text-[9px] text-slate-500"
                  style={{ top: h * HOUR - 6 }}
                >
                  {hourLabel(h, lang)}
                </span>
              ))}
            </div>

            {visibleDays.map((d, di) => {
              const key = toKey(d);
              const baseEvents = (eventsByKey.get(key) ?? []).filter(
                (e) => !(preview && preview.id === e.id)
              );
              const dayEvents = layoutDay(baseEvents);
              const dragged =
                preview && preview.dayIdx === di ? events.find((e) => e.id === preview.id) : null;
              const isTodayCol = isSameDay(d, new Date());

              return (
                <div
                  key={key}
                  className="relative flex-1 border-s border-white/5"
                  onClick={(ev) => {
                    if (activeId) {
                      setActiveId(null);
                      return;
                    }
                    const rect = (ev.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const y = ev.clientY - rect.top;
                    const hourSlot = Math.min(Math.max(Math.floor(y / HOUR), 0), 23);
                    setAddSheet({ dateKey: key, start: hourSlot * 60 });
                  }}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="absolute inset-x-0 border-t border-white/[0.05]" style={{ top: i * HOUR }} />
                  ))}

                  {dayEvents.map(({ event: e, col, total }) => (
                    <EventBlock
                      key={e.id}
                      event={e}
                      mtl={mtl}
                      top={(e.start / 60) * HOUR}
                      height={Math.max(((e.end - e.start) / 60) * HOUR - 2, 22)}
                      rightPct={col * (100 / total)}
                      widthPct={100 / total}
                      compact={view === "week"}
                      isActive={activeId === e.id}
                      onPointerDown={(ev) => onEventPointerDown(ev, e, di)}
                      onPointerMove={onEventPointerMove}
                      onPointerUp={() => onEventPointerUp(e)}
                      onPointerCancel={onEventPointerCancel}
                      onResizeDown={(ev) => onResizePointerDown(ev, e, di)}
                      onResizeMove={onEventPointerMove}
                      onResizeUp={() => onEventPointerUp(e)}
                    />
                  ))}

                  {dragged && preview && (
                    <div
                      className="pointer-events-none absolute z-30 overflow-hidden rounded-lg px-2 py-1 text-start opacity-95 shadow-2xl ring-2 ring-white/80"
                      style={{
                        top: (preview.start / 60) * HOUR,
                        height: Math.max(((preview.end - preview.start) / 60) * HOUR - 2, 22),
                        right: 2,
                        left: 2,
                        background: STATUS_COLOR[dragged.status],
                      }}
                    >
                      <span className="block truncate text-[11px] font-bold leading-tight text-white">
                        {dragged.title}
                      </span>
                      <span className="block truncate text-[9px] text-white/85">
                        {mtl(preview.start)} – {mtl(preview.end)}
                      </span>
                    </div>
                  )}

                  {isTodayCol && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                      style={{ top: (nowMins / 60) * HOUR }}
                    >
                      <span className="-ms-1 h-2.5 w-2.5 rounded-full bg-slate-300/70" />
                      <span className="h-[2px] flex-1 bg-slate-300/70" />
                    </div>
                  )}

                  {view === "day" && dayEvents.length === 0 && !dragged && (
                    <div className="pointer-events-none absolute inset-x-0 top-[40%] text-center">
                      <span className="text-xs text-slate-600">
                        {t("لا توجد مهام — اضغط على أي وقت للإضافة", "No tasks — tap any time to add")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="h-24" />
        </div>
      )}

      {/* hint while active */}
      {activeId && view !== "month" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center">
          <span className="float-in rounded-full border border-white/10 bg-[#161927]/95 px-4 py-2 text-[11px] text-slate-300 shadow-xl backdrop-blur">
            {t(
              "اسحب المهمة للتحريك · اسحب الدائرة السفلية للتمديد",
              "Drag to move · drag the bottom circle to resize"
            )}
          </span>
        </div>
      )}

      {/* sheets */}
      {addSheet && (
        <AddSheet
          dateKey={addSheet.dateKey}
          defaultStart={addSheet.start}
          onClose={() => setAddSheet(null)}
          onSave={saveEvent}
        />
      )}
      {statusSheet && (
        <StatusSheet
          event={events.find((e) => e.id === statusSheet.id) ?? statusSheet}
          onClose={() => setStatusSheet(null)}
          onStatus={(s) => setStatus(statusSheet.id, s)}
          onEdit={() => {
            const fresh = events.find((e) => e.id === statusSheet.id) ?? statusSheet;
            setStatusSheet(null);
            setEditSheet(fresh);
          }}
        />
      )}
      {editSheet && (
        <EditSheet
          event={editSheet}
          onClose={() => setEditSheet(null)}
          onSave={updateEvent}
          onDelete={() => deleteEvent(editSheet.id)}
        />
      )}
    </div>
  );
}

/* ------------------------------- event block ------------------------------ */

function EventBlock({
  event: e,
  mtl,
  top,
  height,
  rightPct,
  widthPct,
  compact,
  isActive,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onResizeDown,
  onResizeMove,
  onResizeUp,
}: {
  event: CalEvent;
  mtl: (m: number) => string;
  top: number;
  height: number;
  rightPct: number;
  widthPct: number;
  compact: boolean;
  isActive: boolean;
  onPointerDown: (ev: React.PointerEvent) => void;
  onPointerMove: (ev: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onResizeDown: (ev: React.PointerEvent) => void;
  onResizeMove: (ev: React.PointerEvent) => void;
  onResizeUp: () => void;
}) {
  const color = STATUS_COLOR[e.status];
  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(ev) => ev.preventDefault()}
      onClick={(ev) => ev.stopPropagation()}
      className={`absolute select-none overflow-visible rounded-lg text-start transition-shadow ${
        isActive ? "z-30 ring-2 ring-white shadow-2xl" : "z-[5]"
      }`}
      style={{
        top,
        height,
        right: `calc(${rightPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        background: e.status === "done" ? `${color}cc` : color,
        boxShadow: isActive ? undefined : `0 2px 10px ${color}33`,
        touchAction: "none",
      }}
    >
      <div className="overflow-hidden px-1.5 py-1" style={{ height: "100%" }}>
        <span
          className={`block truncate font-bold leading-tight text-white ${
            compact ? "text-[9px]" : "text-[11px]"
          } ${e.status === "done" ? "line-through opacity-80" : ""}`}
        >
          {e.title}
        </span>
        {height > 34 && !compact && (
          <span className="block truncate text-[9px] text-white/80">
            {mtl(e.start)} – {mtl(e.end)}
          </span>
        )}
      </div>

      {isActive && (
        <div
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeUp}
          className="absolute -bottom-3 left-1/2 z-40 grid h-7 w-7 -translate-x-1/2 place-items-center"
          style={{ touchAction: "none" }}
        >
          <span className="h-3.5 w-3.5 rounded-full border-2 bg-white shadow-lg" style={{ borderColor: color }} />
        </div>
      )}
    </div>
  );
}

/* -------------------------------- month view ------------------------------ */

function MonthView({
  grid,
  month,
  setMonth,
  selected,
  onSelect,
  eventsByKey,
  onPickEvent,
  onAdd,
}: {
  grid: Date[][];
  month: { y: number; m: number };
  setMonth: React.Dispatch<React.SetStateAction<{ y: number; m: number }>>;
  selected: Date;
  onSelect: (d: Date) => void;
  eventsByKey: Map<string, CalEvent[]>;
  onPickEvent: (e: CalEvent) => void;
  onAdd: (dateKey: string) => void;
}) {
  const { lang, t } = useI18n();
  const mNames = getMonths(lang);
  const dShort = getDaysShort(lang);
  const mtl = (m: number) => minutesToLabel(m, lang);
  const selKey = toKey(selected);
  const selEvents = [...(eventsByKey.get(selKey) ?? [])].sort((a, b) => a.start - b.start);

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <div className="flex items-center justify-between px-4 pt-3">
        <button
          onClick={() => setMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}
          className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300"
        >
          <svg viewBox="0 0 24 24" className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
        <span className="text-sm font-bold text-white">
          {mNames[month.m]} {month.y}
        </span>
        <button
          onClick={() => setMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}
          className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300"
        >
          <svg viewBox="0 0 24 24" className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 border-b border-white/5 px-1 pb-1">
        {dShort.map((_, i) => {
          const idx = (i + 6) % 7;
          return (
            <span key={i} className="text-center text-[10px] text-slate-500">
              {dShort[idx]}
            </span>
          );
        })}
      </div>

      <div className="grid grid-cols-7 px-1">
        {grid.flat().map((d, i) => {
          const key = toKey(d);
          const inMonth = d.getMonth() === month.m;
          const isSel = isSameDay(d, selected);
          const isToday = isSameDay(d, new Date());
          const list = [...(eventsByKey.get(key) ?? [])].sort((a, b) => a.start - b.start);
          return (
            <button
              key={i}
              onClick={() => onSelect(d)}
              className={`flex min-h-[68px] flex-col items-stretch gap-0.5 border-b border-white/[0.04] p-0.5 text-start transition-colors ${
                isSel ? "rounded-lg bg-violet-500/10 ring-1 ring-violet-500/40" : ""
              }`}
            >
              <span
                className={`mx-auto grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                  isToday
                    ? "bg-violet-500 font-bold text-white"
                    : inMonth
                      ? "text-slate-300"
                      : "text-slate-600"
                }`}
              >
                {d.getDate()}
              </span>
              {list.slice(0, 2).map((e) => (
                <span
                  key={e.id}
                  className="block truncate rounded px-1 py-px text-[7.5px] font-semibold leading-snug text-white"
                  style={{ background: STATUS_COLOR[e.status] }}
                >
                  {e.title}
                </span>
              ))}
              {list.length > 2 && (
                <span className="text-center text-[8px] text-slate-500">+{list.length - 2}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2 px-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">{formatFullDate(selected, lang)}</h3>
          <button
            onClick={() => onAdd(selKey)}
            className="flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-300"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {t("إضافة", "Add")}
          </button>
        </div>
        {selEvents.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-600">
            {t("لا توجد مهام في هذا اليوم", "No tasks on this day")}
          </p>
        ) : (
          selEvents.map((e) => (
            <button
              key={e.id}
              onClick={() => onPickEvent(e)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] p-3 text-start transition-transform active:scale-[0.98]"
            >
              <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[e.status] }} />
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm font-semibold text-white ${e.status === "done" ? "line-through opacity-60" : ""}`}>
                  {e.title}
                </span>
                <span className="text-[10px] text-slate-500">
                  {mtl(e.start)} – {mtl(e.end)}
                </span>
              </span>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{ background: `${STATUS_COLOR[e.status]}55`, color: STATUS_COLOR[e.status] }}
              >
                {statusLabel(e.status, t)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------- status sheet ------------------------------ */

function StatusSheet({
  event,
  onClose,
  onStatus,
  onEdit,
}: {
  event: CalEvent;
  onClose: () => void;
  onStatus: (s: Status) => void;
  onEdit: () => void;
}) {
  const { lang, t } = useI18n();
  const mtl = (m: number) => minutesToLabel(m, lang);
  const [y, m, d] = event.dateKey.split("-").map(Number);
  const dateLabel = formatFullDate(new Date(y, m - 1, d), lang);

  const options: { s: Status; label: string; emoji: string }[] = [
    { s: "done", label: t("منجزة", "Done"), emoji: "✓" },
    { s: "postponed", label: t("مؤجلة", "Postponed"), emoji: "⏳" },
    { s: "missed", label: t("فائتة", "Missed"), emoji: "✕" },
  ];

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-start gap-3">
        <span className="mt-1.5 h-4 w-4 shrink-0 rounded-md" style={{ background: STATUS_COLOR[event.status] }} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-white">{event.title}</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {dateLabel} · {mtl(event.start)} – {mtl(event.end)}
          </p>
        </div>
        <button
          onClick={onEdit}
          className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
          </svg>
          {t("تعديل", "Edit")}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {options.map((o) => {
          const isCurrent = event.status === o.s;
          const c = STATUS_COLOR[o.s];
          return (
            <button
              key={o.s}
              onClick={() => onStatus(o.s)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3.5 transition-all active:scale-95 ${
                isCurrent ? "ring-2" : ""
              }`}
              style={{
                background: `${c}1a`,
                borderColor: `${c}40`,
                color: c,
                ...(isCurrent ? ({ "--tw-ring-color": c } as React.CSSProperties) : {}),
              }}
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-full text-base font-bold text-white"
                style={{ background: c }}
              >
                {o.emoji}
              </span>
              <span className="text-xs font-bold">{o.label}</span>
            </button>
          );
        })}
      </div>

      {event.status !== "pending" && (
        <p className="mt-3 text-center text-[10px] text-slate-500">
          {t(
            `اضغط على الحالة الحالية (${statusLabel(event.status, t)}) لإلغائها وإرجاع اللون الأزرق`,
            `Tap the current status (${statusLabel(event.status, t)}) to reset it back to blue`
          )}
        </p>
      )}
    </Sheet>
  );
}

/* -------------------------------- add sheet ------------------------------- */

function AddSheet({
  dateKey,
  defaultStart,
  onClose,
  onSave,
}: {
  dateKey: string;
  defaultStart: number;
  onClose: () => void;
  onSave: (title: string, start: number, duration: number) => void;
}) {
  const { lang, t } = useI18n();
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(defaultStart);
  const [duration, setDuration] = useState(60);

  const [y, m, d] = dateKey.split("-").map(Number);
  const dateLabel = formatFullDate(new Date(y, m - 1, d), lang);
  const timeOptions = Array.from({ length: 48 }, (_, i) => i * 30);

  return (
    <Sheet onClose={onClose}>
      <h3 className="text-lg font-bold text-white">{t("مهمة جديدة", "New task")}</h3>
      <p className="mt-0.5 text-xs text-slate-400">📅 {dateLabel}</p>

      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("ماذا تريد أن تنجز؟", "What do you want to get done?")}
        className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
      />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[11px] text-slate-400">{t("وقت البدء", "Start time")}</span>
          <select
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-[#161927] px-3 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
          >
            {timeOptions.map((x) => (
              <option key={x} value={x}>
                {minutesToLabel(x, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] text-slate-400">{t("المدة", "Duration")}</span>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-[#161927] px-3 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
          >
            <option value={30}>{t("٣٠ دقيقة", "30 min")}</option>
            <option value={60}>{t("ساعة", "1 hour")}</option>
            <option value={90}>{t("ساعة ونصف", "1.5 hours")}</option>
            <option value={120}>{t("ساعتان", "2 hours")}</option>
            <option value={180}>{t("٣ ساعات", "3 hours")}</option>
          </select>
        </label>
      </div>

      <button
        onClick={() => onSave(title, start, duration)}
        disabled={!title.trim()}
        className="mt-6 w-full rounded-2xl bg-gradient-to-l from-sky-500 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/30 transition-all active:scale-[0.98] disabled:opacity-40"
      >
        {t("حفظ المهمة", "Save task")}
      </button>
    </Sheet>
  );
}

/* -------------------------------- edit sheet ------------------------------- */

function EditSheet({
  event,
  onClose,
  onSave,
  onDelete,
}: {
  event: CalEvent;
  onClose: () => void;
  onSave: (id: string, title: string, start: number, duration: number) => void;
  onDelete: () => void;
}) {
  const { lang, t } = useI18n();
  const [title, setTitle] = useState(event.title);
  const [start, setStart] = useState(event.start - (event.start % 30));
  const [duration, setDuration] = useState(event.end - event.start);

  const [y, m, d] = event.dateKey.split("-").map(Number);
  const dateLabel = formatFullDate(new Date(y, m - 1, d), lang);
  const timeOptions = Array.from({ length: 48 }, (_, i) => i * 30);
  const durOptions = [30, 60, 90, 120, 180];
  if (!durOptions.includes(duration)) durOptions.push(duration);

  const durLabel = (x: number) =>
    lang === "ar"
      ? x < 60
        ? `${x} دقيقة`
        : x % 60 === 0
          ? `${x / 60} ساعة`
          : `${Math.floor(x / 60)} س ${x % 60} د`
      : x < 60
        ? `${x} min`
        : x % 60 === 0
          ? `${x / 60} h`
          : `${Math.floor(x / 60)}h ${x % 60}m`;

  return (
    <Sheet onClose={onClose}>
      <h3 className="text-lg font-bold text-white">{t("تعديل المهمة", "Edit task")}</h3>
      <p className="mt-0.5 text-xs text-slate-400">📅 {dateLabel}</p>

      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
      />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[11px] text-slate-400">{t("وقت البدء", "Start time")}</span>
          <select
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-[#161927] px-3 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
          >
            {timeOptions.map((x) => (
              <option key={x} value={x}>
                {minutesToLabel(x, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] text-slate-400">{t("المدة", "Duration")}</span>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-[#161927] px-3 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
          >
            {durOptions
              .sort((a, b) => a - b)
              .map((x) => (
                <option key={x} value={x}>
                  {durLabel(x)}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <button
          onClick={() => onSave(event.id, title, start, duration)}
          disabled={!title.trim()}
          className="col-span-2 rounded-2xl bg-gradient-to-l from-sky-500 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/30 transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {t("حفظ التعديلات", "Save changes")}
        </button>
        <button
          onClick={onDelete}
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 py-3.5 text-sm font-bold text-rose-400 transition-all active:scale-[0.98]"
        >
          {t("حذف", "Delete")}
        </button>
      </div>
    </Sheet>
  );
}

/* ------------------------------ sheet wrapper ------------------------------ */

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="float-in relative w-full rounded-t-3xl border-t border-white/10 bg-[#11131e] p-5 pb-8 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
        {children}
      </div>
    </div>
  );
}
