import { useContext, useState } from "react";
import AppFooter from "../modules/footer/components/MainFooter";
import { LanguageContext } from "../modules/home/components/LanguageToggle";
import etex from "../data/media/images/main/etex.bmp";
import itex from "../data/media/images/main/itex.bmp";

import menu1 from "../data/media/images/main/m1.bmp";
import menu2 from "../data/media/images/main/m2.bmp";
import menu3 from "../data/media/images/main/m3.bmp";
import menu4 from "../data/media/images/main/m4.bmp";
import menu5 from "../data/media/images/main/m5.bmp";
import menu6 from "../data/media/images/main/m6.bmp";

import "./Home.css";
import { Link } from "react-router-dom";
import LockedElement from "../modules/common/components/LockedElement";
import HomeSky from "../modules/home/components/HomeSky";
import { motion } from "framer-motion";
import { useCurrentBgMusic } from "../modules/audioplayer/hooks/bgmusicHooks";

const Home = () => {
  useCurrentBgMusic("/wave/main.wav");

  console.log("Init home page");
  const { language } = useContext(LanguageContext);
  const [mainCenterCss, setMainCenterCss] = useState({});

  const translations = {
    e: etex,
    i: itex,
  };

  const menuImages = [menu1, menu2, menu3, menu4, menu5, menu6];

  const menuOver = (i: number, on: boolean) => {
    if (on === true)
      setMainCenterCss({
        display: "block",
        backgroundPosition: "0% " + (i - 1) * 20 + "%",
      });
    else setMainCenterCss({ display: "none" });
  };

  const availablePaths: Record<number, string> = {
    0: "/city",
    1: "/history",
  };

  return (
    <motion.div
      style={{ position: "absolute", zIndex: 1 }}
      initial="initial"
      animate="in"
      exit="out"
      variants={{
        initial: {
          opacity: 1,
        },
        in: {
          opacity: 1,
          transition: { duration: 0 },
        },
        out: {
          opacity: 1,
          zIndex: 0,
          transitionEnd: { display: "none" },
          transition: { duration: 1 },
        },
      }}
    >
      <div id="main-page" className="page-div">
        <div id="main-header">
          <HomeSky />
        </div>

        <div id="main-center">
          <div
            id="main-center-text"
            style={{
              ...mainCenterCss,
              backgroundImage: `url(${translations[language]})`,
            }}
          ></div>
          {menuImages.map((value, index) => {
            const image = (
              <img
                id={`main-menuimg-${index + 1}`}
                className="main-menuitem-img"
                src={value}
                alt="menu"
                key={index}
              ></img>
            );

            return (
              <>
                <div id={`page-${index + 1}`} key={index}>
                  <div
                    className="main-menuitem"
                    style={{ marginLeft: `${index * 103}px` }}
                    onMouseOver={() => menuOver(index + 1, true)}
                    onMouseOut={() => menuOver(0, false)}
                    key={index}
                  >
                    {availablePaths[index] ? (
                      <Link to={availablePaths[index]}>{image}</Link>
                    ) : (
                      <LockedElement>{image}</LockedElement>
                    )}
                  </div>
                </div>
              </>
            );
          })}
        </div>

        <div id="main-bottom"></div>
        <AppFooter />
      </div>
    </motion.div>
  );
};

export default Home;
