import { HomeIcon, TasksIcon, HabitsIcon, TargetIcon, MoreIcon } from "./Icons";
import type { TabId } from "../App";
import { useI18n } from "../i18n";

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const tabs: { id: TabId; ar: string; en: string; Icon: typeof HomeIcon }[] = [
  { id: "home", ar: "الرئيسية", en: "Home", Icon: HomeIcon },
  { id: "tasks", ar: "المهام", en: "Tasks", Icon: TasksIcon },
  { id: "habits", ar: "العادات", en: "Habits", Icon: HabitsIcon },
  { id: "goals", ar: "الأهداف", en: "Goals", Icon: TargetIcon },
  { id: "more", ar: "المزيد", en: "More", Icon: MoreIcon },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  const { t } = useI18n();
  return (
    <nav className="absolute inset-x-0 bottom-0 z-30">
      <div className="border-t border-white/5 bg-[#0c0e16]/90 px-2 pb-5 pt-2 backdrop-blur-xl">
        <div className="grid grid-cols-5">
          {tabs.map(({ id, ar, en, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className={`flex flex-col items-center gap-1 py-1.5 transition-colors ${
                  isActive ? "text-violet-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon className="h-[22px] w-[22px]" filled={isActive} />
                <span className={`text-[10px] ${isActive ? "font-semibold" : "font-normal"}`}>
                  {t(ar, en)}
                </span>
                <span
                  className={`h-1 w-1 rounded-full transition-all ${
                    isActive ? "bg-violet-400" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
