import { useContext } from "react";
import { LanguageContext } from "../../home/components/LanguageToggle";

export default function LockedElement({
  children,
}: {
  children: React.ReactNode;
}) {
  const languageContext = useContext(LanguageContext);

  return (
    <div
      className="locked"
      onClick={() =>
        alert(
          languageContext.language === "i"
            ? "Contenuto non ancora disponibile! Lavori in corso..."
            : "Not available content! Work in progress..."
        )
      }
    >
      {children}
    </div>
  );
}
