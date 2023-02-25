import Marquee from "react-fast-marquee";
import LanguageToggle, { LanguageContext } from "./LanguageToggle";
import e_text from "../data/media/text/main/escroll.txt";
import i_text from "../data/media/text/main/iscroll.txt";

import { useState, useContext, useEffect } from "react";
import "./MainFooter.css";
import BottomRightMenu from "./BottomRightMenu";

export default function MainFooter() {
  const { language } = useContext(LanguageContext);

  const [scrollingText, setScrollingText] = useState("");

  useEffect(() => {
    fetch(language === "e" ? e_text : i_text).then((response) => {
      response.text().then((text) => {
        setScrollingText(text);
      });
    });
  }, [language]);

  return (
    <div id="bottom-bar">
      <div id="bottom-left">
        <LanguageToggle />
      </div>
      <div id="bottom-center">
        <div id="bottom-scroll">
          <div className="marquee-scroll">
            {scrollingText && (
              <Marquee
                delay={1}
                loop={0}
                direction="left"
                speed={40}
                gradient={false}
                key={language}
                className={`marquee-scroll`}
              >
                {scrollingText
                  .split("\n")
                  .filter((line) => line.trim() !== "")
                  .map((line) => (
                    <div className="marquee-text">{line}</div>
                  ))}
              </Marquee>
            )}
          </div>
        </div>
      </div>
      <BottomRightMenu />
    </div>
  );
}
