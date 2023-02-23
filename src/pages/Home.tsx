import { useContext, useEffect, useMemo, useState } from "react";
import AppFooter from "../components/AppFooter";
import { BgMusicContext } from "../components/BgMusic";
import { LanguageContext } from "../components/LanguageToggle";
import etex from "../data/media/images/main/etex.bmp";
import itex from "../data/media/images/main/itex.bmp";

import menu1 from "../data/media/images/main/m1.bmp";
import menu2 from "../data/media/images/main/m2.bmp";
import menu3 from "../data/media/images/main/m3.bmp";
import menu4 from "../data/media/images/main/m4.bmp";
import menu5 from "../data/media/images/main/m5.bmp";
import menu6 from "../data/media/images/main/m6.bmp";

import header1 from "../data/media/images/main/1.bmp";
import header2 from "../data/media/images/main/2.bmp";
import header3 from "../data/media/images/main/3.bmp";
import header4 from "../data/media/images/main/4.bmp";
import header5 from "../data/media/images/main/5.bmp";
import header6 from "../data/media/images/main/6.bmp";
import header7 from "../data/media/images/main/7.bmp";
import header8 from "../data/media/images/main/8.bmp";
import header9 from "../data/media/images/main/9.bmp";
import header10 from "../data/media/images/main/10.bmp";

import "./Home.css";

const Home = () => {
  const bgMusic = useContext(BgMusicContext);
  const { language } = useContext(LanguageContext);
  const [mainCenterCss, setMainCenterCss] = useState({});

  const translations = {
    e: etex,
    i: itex,
  };

  const menuImages = [menu1, menu2, menu3, menu4, menu5, menu6];
  const headerImages: React.ElementType[] = useMemo(
    () => [
      ({ display }) => (
        <img src={header1} alt="sky" style={{ display }} key="1" />
      ),
      ({ display }) => (
        <img src={header2} alt="sky" style={{ display }} key="2" />
      ),
      ({ display }) => (
        <img src={header3} alt="sky" style={{ display }} key="3" />
      ),
      ({ display }) => (
        <img src={header4} alt="sky" style={{ display }} key="4" />
      ),
      ({ display }) => (
        <img src={header5} alt="sky" style={{ display }} key="5" />
      ),
      ({ display }) => (
        <img src={header6} alt="sky" style={{ display }} key="6" />
      ),
      ({ display }) => (
        <img src={header7} alt="sky" style={{ display }} key="7" />
      ),
      ({ display }) => (
        <img src={header8} alt="sky" style={{ display }} key="8" />
      ),
      ({ display }) => (
        <img src={header9} alt="sky" style={{ display }} key="9" />
      ),
      ({ display }) => (
        <img src={header10} alt="sky" style={{ display }} key="10" />
      ),
    ],
    []
  );

  useEffect(() => {
    bgMusic.setMusic({ play: true, src: "/wave/main.wav" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const menuOver = (i: number, on: boolean) => {
    if (on === true)
      setMainCenterCss({
        display: "block",
        backgroundPosition: "0% " + (i - 1) * 20 + "%",
      });
    else setMainCenterCss({ display: "none" });
  };

  const [currentImage, setCurrentImage] = useState({
    index: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentImage.index === headerImages.length - 1) {
        setCurrentImage({ index: 0 });
      } else {
        setCurrentImage({
          index: currentImage.index + 1,
        });
      }
    }, 200);
    return () => clearInterval(interval);
  }, [currentImage, headerImages]);

  return (
    <div id="main-page">
      <div id="main-header">
        {headerImages.map((Image, index) => (
          <Image
            display={currentImage.index === index ? "block" : "none"}
            key={index}
          />
        ))}
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
                  <img
                    id={`main-menuimg-${index + 1}`}
                    className="main-menuitem-img"
                    src={value}
                    alt="menu"
                    key={index}
                  ></img>
                </div>
              </div>
            </>
          );
        })}
      </div>

      <div id="main-bottom"></div>
      <AppFooter />
    </div>
  );
};

export default Home;
