import { createContext, useContext } from "react";

export type Lang = "ar" | "en";
export type Accent = "violet" | "sky" | "emerald" | "rose" | "amber";

export interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  accent: Accent;
  setAccent: (a: Accent) => void;
  userName: string;
  setUserName: (n: string) => void;
  /** t("نص عربي", "English text") */
  t: (ar: string, en: string) => string;
}

export const I18nContext = createContext<I18nCtx>({
  lang: "ar",
  setLang: () => {},
  accent: "violet",
  setAccent: () => {},
  userName: "",
  setUserName: () => {},
  t: (ar) => ar,
});

export const useI18n = () => useContext(I18nContext);

export const ACCENTS: { id: Accent; color: string; nameAr: string; nameEn: string }[] = [
  { id: "violet", color: "#8b5cf6", nameAr: "بنفسجي", nameEn: "Violet" },
  { id: "sky", color: "#0ea5e9", nameAr: "سماوي", nameEn: "Sky" },
  { id: "emerald", color: "#10b981", nameAr: "أخضر", nameEn: "Emerald" },
  { id: "rose", color: "#f43f5e", nameAr: "وردي", nameEn: "Rose" },
  { id: "amber", color: "#f59e0b", nameAr: "ذهبي", nameEn: "Amber" },
];
