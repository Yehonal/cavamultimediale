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
          ></motion.div>
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
