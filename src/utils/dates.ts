export type Lng = "ar" | "en";

export const monthNames = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const monthNamesEn = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// index = Date.getDay() (0 = Sunday)
export const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const dayNamesShort = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
export const dayNamesShortEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const getMonths = (l: Lng) => (l === "ar" ? monthNames : monthNamesEn);
export const getDaysShort = (l: Lng) => (l === "ar" ? dayNamesShort : dayNamesShortEn);

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toKey(a) === toKey(b);
}

/** Week starts Saturday */
export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 1) % 7));
  return r;
}

/** 6 weeks grid for a month, starting Saturday */
export function getMonthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  let cursor = startOfWeek(first);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** minutes since midnight -> "9:30 ص" / "9:30 AM" */
export function minutesToLabel(mins: number, lang: Lng = "ar"): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = lang === "ar" ? (h < 12 ? "ص" : "م") : h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function hourLabel(h: number, lang: Lng = "ar"): string {
  const period = lang === "ar" ? (h < 12 ? "ص" : "م") : h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${period}`;
}

export function formatFullDate(d: Date, lang: Lng = "ar"): string {
  if (lang === "ar") {
    return `${dayNames[d.getDay()]}، ${d.getDate()} ${monthNames[d.getMonth()]}`;
  }
  return `${dayNamesEn[d.getDay()]}, ${monthNamesEn[d.getMonth()]} ${d.getDate()}`;
}
