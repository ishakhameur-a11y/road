export type Priority = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  titleEn: string;
  time: string;
  timeEn: string;
  category: string;
  categoryEn: string;
  categoryColor: string;
  priority: Priority;
  done: boolean;
}

export interface Habit {
  id: string;
  title: string;
  titleEn: string;
  emoji: string;
  streak: number;
  goal: number;
  doneToday: number;
  color: string;
}

export const initialTasks: Task[] = [
  {
    id: "t1",
    title: "مراجعة خطة المشروع الأسبوعية",
    titleEn: "Review weekly project plan",
    time: "09:00 ص",
    timeEn: "09:00 AM",
    category: "العمل",
    categoryEn: "Work",
    categoryColor: "#818cf8",
    priority: "high",
    done: true,
  },
  {
    id: "t2",
    title: "اجتماع فريق التصميم",
    titleEn: "Design team meeting",
    time: "11:30 ص",
    timeEn: "11:30 AM",
    category: "العمل",
    categoryEn: "Work",
    categoryColor: "#818cf8",
    priority: "high",
    done: false,
  },
  {
    id: "t3",
    title: "قراءة 20 صفحة من كتاب العادات الذرية",
    titleEn: "Read 20 pages of Atomic Habits",
    time: "04:00 م",
    timeEn: "04:00 PM",
    category: "تطوير ذاتي",
    categoryEn: "Self-growth",
    categoryColor: "#34d399",
    priority: "medium",
    done: false,
  },
  {
    id: "t4",
    title: "تمارين رياضية — جري 5 كم",
    titleEn: "Workout — 5km run",
    time: "06:30 م",
    timeEn: "06:30 PM",
    category: "صحة",
    categoryEn: "Health",
    categoryColor: "#f472b6",
    priority: "medium",
    done: false,
  },
  {
    id: "t5",
    title: "شراء مستلزمات المنزل",
    titleEn: "Buy home supplies",
    time: "08:00 م",
    timeEn: "08:00 PM",
    category: "شخصي",
    categoryEn: "Personal",
    categoryColor: "#fbbf24",
    priority: "low",
    done: false,
  },
];

export const habits: Habit[] = [
  { id: "h1", title: "شرب الماء", titleEn: "Drink water", emoji: "💧", streak: 12, goal: 8, doneToday: 5, color: "#38bdf8" },
  { id: "h2", title: "قراءة", titleEn: "Reading", emoji: "📖", streak: 7, goal: 1, doneToday: 1, color: "#34d399" },
  { id: "h3", title: "تأمل", titleEn: "Meditation", emoji: "🧘", streak: 21, goal: 1, doneToday: 0, color: "#a78bfa" },
  { id: "h4", title: "رياضة", titleEn: "Exercise", emoji: "🏃", streak: 4, goal: 1, doneToday: 0, color: "#fb7185" },
];
