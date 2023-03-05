import { motion } from "framer-motion";
import { useContext, useEffect, useState } from "react";
import { LanguageContext } from "../modules/home/components/LanguageToggle";
import "./History.css";

import iPageBg from "../data/media/images/stor/istoria.jpg";
import ePageBg from "../data/media/images/stor/estoria.jpg";

import ipers from "../data/media/images/stor/pi.jpg";
import epers from "../data/media/images/stor/pe.jpg";

import istoria from "../data/media/images/stor/si.jpg";
import estoria from "../data/media/images/stor/se.jpg";

import SubPageFooter from "../modules/footer/components/SubPageFooter";
import { Link, useLocation } from "react-router-dom";
import { useCurrentBgMusic } from "../modules/audioplayer/hooks/bgmusicHooks";
import { artists, heroes, others, writers } from "./history-pages/lists";

export default function History() {
  useCurrentBgMusic("/wave/cava.wav");
  const { language } = useContext(LanguageContext);

  const [showPers, setShowPers] = useState(false);
  const [showStoria, setShowStoria] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (location.hash === "") {
      setShowPers(false);
      setShowStoria(false);
    }
  }, [location]);

  const languagePxAdjust = language === "e" ? 10 : 0;

  const wordLenghtFormula = (word: string) => {
    return (word.length + word.split("_").length) * 0.85;
  };

  return (
    <motion.div
      style={{ position: "absolute", zIndex: 1 }}
      initial={{ width: "0%" }}
      animate={{ width: "100%", transition: { duration: 1 } }}
      exit={{
        width: "100%",
        zIndex: 0,
        transitionEnd: { display: "none" },
        transition: { duration: 0.5 },
      }}
    >
      <div
        id="history-page"
        className="page-div"
        style={{
          backgroundImage: `url(${language === "e" ? ePageBg : iPageBg})`,
        }}
      >
        {(showStoria && (
          <motion.div
            style={{
              position: "absolute",
              top: "286px",
              backgroundImage: `url(${language === "e" ? estoria : istoria})`,
              maxWidth: "638px",
              height: "193px",
              zIndex: 2,
            }}
            initial={{ width: "0%" }}
            animate={{ width: "638px", transition: { duration: 1 } }}
            exit={{
              width: "100%",
              zIndex: 0,
              transitionEnd: { display: "none" },
              transition: { duration: 0 },
            }}
          ></motion.div>
        )) || (
          <Link
            to="#story"
            id="history-button"
            style={{
              position: "absolute",
              marginTop: "20px",
              marginLeft: "100px",
              // border: "yellow 2px solid",
              width: "300px",
              height: "50px",
            }}
            onClick={() => setShowStoria(!showStoria)}
          ></Link>
        )}

        {(showPers && (
          <motion.div
            style={{
              position: "absolute",
              backgroundImage: `url(${language === "e" ? epers : ipers})`,
              width: "640px",
              height: "430px",
              zIndex: 2,
            }}
            initial={{ width: "0%" }}
            animate={{ width: "638px", transition: { duration: 1 } }}
            exit={{
              width: "100%",
              zIndex: 0,
              transitionEnd: { display: "none" },
              transition: { duration: 0 },
            }}
          >
            {artists.map((route, index) => (
              <Link
                to={route}
                style={{
                  position: "absolute",
                  marginTop: `${30 * (index + 1) - languagePxAdjust}px`,
                  marginLeft: `${180 - wordLenghtFormula(route) * 8.5}px`,
                  //   border: "yellow 2px solid",
                  width: `${wordLenghtFormula(route) * 8.5}px`,
                  height: "30px",
                }}
              ></Link>
            ))}
            {others.map((route, index) => (
              <Link
                to={route}
                style={{
                  position: "absolute",
                  marginTop: `${
                    29 * (index + artists.length + 2) - languagePxAdjust
                  }px`,
                  marginLeft: `${180 - wordLenghtFormula(route) * 8.5}px`,
                  //   border: "yellow 2px solid",
                  width: `${wordLenghtFormula(route) * 8.5}px`,
                  height: "30px",
                }}
              ></Link>
            ))}
            {writers.map((route, index) => (
              <Link
                to={route}
                style={{
                  position: "absolute",
                  marginTop: `${30 * (index + 1) + 30 - languagePxAdjust}px`,
                  marginLeft: "245px",
                  //   border: "yellow 2px solid",
                  width: `${wordLenghtFormula(route) * 9.5}px`,
                  height: "23px",
                }}
              ></Link>
            ))}
            {heroes.map((route, index) => (
              <Link
                to={route}
                style={{
                  position: "absolute",
                  marginTop: `${27.5 * (index + 1) + 30 - languagePxAdjust}px`,
                  marginLeft: `${620 - wordLenghtFormula(route) * 9}px`,
                  //   border: "yellow 2px solid",
                  width: `${wordLenghtFormula(route) * 9}px`,
                  height: "20px",
                }}
              ></Link>
            ))}
          </motion.div>
        )) || (
          <Link
            to="#pers"
            id="pers-button"
            style={{
              position: "absolute",
              marginTop: "420px",
              marginLeft: "60px",
              // border: "yellow 2px solid",
              width: "350px",
              height: "50px",
            }}
            onClick={() => setShowPers(!showPers)}
          ></Link>
        )}

        <SubPageFooter />
      </div>
    </motion.div>
  );
}
