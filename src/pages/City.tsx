import { createRef, useContext, useEffect, useState } from "react";
import { LanguageContext } from "../components/LanguageToggle";
import SubPageFooter from "../components/SubPageFooter";
import "./City.css";

import e_text from "../data/media/text/ccav/ebenv.txt";
import i_text from "../data/media/text/ccav/ibenv.txt";

import iPageBg from "../data/media/images/cittcava/iimgmain.jpg";
import ePageBg from "../data/media/images/cittcava/eimgmain.jpg";

import em1 from "../data/media/images/cittcava/em1.bmp";
import im1 from "../data/media/images/cittcava/im1.bmp";

import em2 from "../data/media/images/cittcava/em2.bmp";
import im2 from "../data/media/images/cittcava/im2.bmp";

import BlackScrollArrows from "../components/BlackScrollArrows";
import { Link } from "react-router-dom";
import { BgMusicContext, IBgMusicContext } from "../components/BgMusic";
import { motion } from "framer-motion";

export default function City() {
  const [isAnimating, setIsAnimating] = useState(true);

  // if the music is not playing, play it
  const bgMusic = useContext(BgMusicContext);
  useEffect(() => {
    bgMusic.setMusic((music: IBgMusicContext) => ({
      ...music,
      play: true,
      src: "/wave/main.wav",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { language } = useContext(LanguageContext);

  const [scrollingText, setScrollingText] = useState("");

  useEffect(() => {
    fetch(language === "e" ? e_text : i_text).then((response) => {
      response.text().then((text) => {
        setScrollingText(text);
      });
    });
  }, [language]);

  const centerTextRef = createRef<HTMLDivElement>();

  return (
    <motion.div
      style={{ position: "absolute", zIndex: 3 }}
      initial={{ width: "0%" }}
      animate={{ width: "100%" }}
      transition={{ duration: 1 }}
      exit={{ opacity: "1", width: "100%" }}
      onAnimationComplete={() => {
        setIsAnimating(false);
      }}
    >
      <div>
        <div
          id="city-page"
          style={{
            backgroundImage: `url(${language === "e" ? ePageBg : iPageBg})`,
          }}
        >
          <div id="city-north">
            <Link to="/city/yesterday">
              <div id="city-yesterday" className="city-gallery-button">
                <img src={language === "e" ? em1 : im1} alt="city-yesterday" />
              </div>
            </Link>
          </div>
          <div id="city-center">
            <div id="city-text-wrapper">
              <div
                id="city-text"
                className="hide-scrollbar"
                ref={centerTextRef}
              >
                {isAnimating === false && scrollingText}
              </div>
            </div>
            <div id="city-text-scroll-wrapper">
              <div id="city-text-scroll">
                {isAnimating === false && (
                  <BlackScrollArrows textRef={centerTextRef} />
                )}
              </div>
            </div>
          </div>
          <div id="city-south">
            <Link to="/city/today">
              <div id="city-today" className="city-gallery-button">
                <img
                  id={`${language}-today-btn-hover`}
                  src={language === "e" ? em2 : im2}
                  alt="city-today"
                />
              </div>
            </Link>
          </div>
        </div>
        <SubPageFooter />
      </div>
    </motion.div>
  );
}
