import e_br_text from "../../../data/media/text/bottombar/erightmenu.txt";
import i_br_text from "../../../data/media/text/bottombar/irightmenu.txt";
import { Link } from "react-router-dom";
import LockedElement from "../../common/components/LockedElement";
import { useState, useEffect, useContext } from "react";
import { LanguageContext } from "../../home/components/LanguageToggle";

export default function BottomRightMenu() {
  const { language } = useContext(LanguageContext);

  const [rightMenuText, setRightMenuText] = useState("");

  useEffect(() => {
    fetch(language === "e" ? e_br_text : i_br_text).then((response) => {
      response.text().then((text) => {
        setRightMenuText(text);
      });
    });
  }, [language]);

  const availableRoutes: Record<number, boolean | string> = {
    0: false,
    1: false,
    2: false,
  };

  return (
    <div id="bottom-right">
      {rightMenuText &&
        rightMenuText
          .split("\n")

          .map((item, index) => {
            return availableRoutes[index] !== false ? (
              <Link to={availableRoutes[index] as string}>{item}</Link>
            ) : (
              <LockedElement>{item}</LockedElement>
            );
          })
          .map((line) => <div className="bottom-item">{line}</div>)}
    </div>
  );
}
