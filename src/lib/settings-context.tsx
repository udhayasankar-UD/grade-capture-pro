import { createContext, useContext, useEffect, useState } from "react";

export type PartType = "single" | "choice";

export interface PartConfig {
  id: string;
  name: string;
  enabled: boolean;
  type: PartType;
  questionCount: number;
  maxMarks: number;
}

export interface AppSettings {
  parts: PartConfig[];
}

export const defaultSettings: AppSettings = {
  parts: [
    { id: "A", name: "Part A", enabled: true, type: "single", questionCount: 5, maxMarks: 2 },
    { id: "B", name: "Part B", enabled: true, type: "choice", questionCount: 5, maxMarks: 4 },
    { id: "C", name: "Part C", enabled: true, type: "choice", questionCount: 5, maxMarks: 7 },
  ],
};

const SettingsContext = createContext<{
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
}>({ settings: defaultSettings, updateSettings: () => {} });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem("thaal_settings");
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultSettings;
  });

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem("thaal_settings", JSON.stringify(newSettings));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
