import { createContext, useState } from "react";

export const SettingContext = createContext();

export function SettingProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("javascript");
  const [fontSize, setFontSize] = useState(14);

  return (
    <SettingContext.Provider
      value={{ theme, setTheme, language, setLanguage, fontSize, setFontSize }}
    >
      {children}
    </SettingContext.Provider>
  );
}