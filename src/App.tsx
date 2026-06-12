import { useState } from "react";
import BottomNav from "./components/BottomNav";
import HomeScreen from "./screens/HomeScreen";
import TasksScreen from "./screens/TasksScreen";
import HabitsScreen from "./screens/HabitsScreen";
import GoalsScreen from "./screens/GoalsScreen";
import MoreScreen from "./screens/MoreScreen";
import { I18nContext, type Lang, type Accent } from "./i18n";

export type TabId = "home" | "tasks" | "habits" | "goals" | "more";

export default function App() {
  const [tab, setTab] = useState<TabId>("home");
  const [lang, setLang] = useState<Lang>("ar");
  const [accent, setAccent] = useState<Accent>("violet");
  const [userName, setUserName] = useState("سلطان العتيبي");

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <I18nContext.Provider value={{ lang, setLang, accent, setAccent, userName, setUserName, t }}>
      <div className="flex min-h-screen items-center justify-center bg-[#07080d] sm:py-6">
        {/* Phone frame */}
        <div
          dir={lang === "ar" ? "rtl" : "ltr"}
          data-accent={accent}
          className="relative flex h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-[#0c0e16] sm:h-[860px] sm:max-h-[92vh] sm:rounded-[2.5rem] sm:border sm:border-white/10 sm:shadow-2xl sm:shadow-black/60"
        >
          {/* ambient glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />

          {/* كل التبويبات تبقى محمّلة للحفاظ على البيانات عند التنقل */}
          <main className="relative flex-1 overflow-hidden" key={lang}>
            <div className={`h-full overflow-y-auto ${tab === "home" ? "" : "hidden"}`}>
              <HomeScreen onNavigate={(x) => setTab(x)} />
            </div>
            <div className={`h-full ${tab === "tasks" ? "" : "hidden"}`}>
              <TasksScreen />
            </div>
            <div className={`h-full ${tab === "habits" ? "" : "hidden"}`}>
              <HabitsScreen />
            </div>
            <div className={`h-full ${tab === "goals" ? "" : "hidden"}`}>
              <GoalsScreen />
            </div>
            <div className={`h-full ${tab === "more" ? "" : "hidden"}`}>
              <MoreScreen />
            </div>
          </main>

          <BottomNav active={tab} onChange={setTab} />
        </div>
      </div>
    </I18nContext.Provider>
  );
}
