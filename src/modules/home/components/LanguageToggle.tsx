import { createContext, useContext, useEffect, useMemo, useState } from "react";
import i_sel from "../../../data/media/images/flags/ita_sel.png";
import i from "../../../data/media/images/flags/ita.png";
import e_sel from "../../../data/media/images/flags/eng_sel.png";
import e from "../../../data/media/images/flags/eng.png";

const flagImages: Record<string, string> = {
  i_sel,
  i,
  e_sel,
  e,
};

export type LanguageContextType = {
  language: "e" | "i";
  setLanguage: { (language: "i" | "e"): void };
};

export function useLanguageStatus() {
  const [language, setLanguage] = useState<"e" | "i">("i");

  return useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
}

export const LanguageContext = createContext({} as LanguageContextType);

export default function LanguageToggle() {
  const { language, setLanguage } = useContext(LanguageContext);
  const [flags, setFlags] = useState(["i_sel", "e"]);

  useEffect(() => {
    switch (language) {
      case "e":
        setFlags(["i", "e_sel"]);
        break;
      default:
        setFlags(["i_sel", "e"]);
    }
  }, [language]);

  return (
    <>
      <div className={`main-flag-${flags[0]}`}>
        <img
          style={{ cursor: "pointer" }}
          onClick={() => setLanguage("i")}
          src={flagImages[flags[0]]}
          alt={flags[0]}
        />
      </div>
      <div className={`main-flag-${flags[1]}`}>
        <img
          style={{ cursor: "pointer" }}
          onClick={() => setLanguage("e")}
          src={flagImages[flags[1]]}
          alt={flags[1]}
        />
      </div>
    </>
  );
}
