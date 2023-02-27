import { motion } from "framer-motion";
import { useContext, useState } from "react";
import { AppContext } from "../../AppContext";
import LinkButton from "../../modules/common/components/LinkButton";
import IDeveloping from "./i-developing";
import IFAQ from "./i-faq";
import IIntro from "./i-intro";
import IOrigin from "./i-origin";
import "./project-info.css";

export default function ProjectInfo() {
  const [infoPage, setInfoPage] = useState(IDeveloping);
  const appContext = useContext(AppContext);

  return (
    <motion.div
      style={{ zIndex: 1 }}
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
          transition: { duration: 0 },
        },
      }}
    >
      <div id="project-info">
        <div id="left-menu">
          <ul id="left-menu-list">
            <li>
              <LinkButton id="nav-intro" onClick={() => setInfoPage(IIntro)}>
                Intro
              </LinkButton>
            </li>
            <li>
              <LinkButton id="nav-faq" onClick={() => setInfoPage(IFAQ)}>
                FAQ
              </LinkButton>
            </li>
            <li>
              <LinkButton id="nav-origin" onClick={() => setInfoPage(IOrigin)}>
                CD Originale
              </LinkButton>
            </li>
            <li>
              <LinkButton
                id="nav-developing"
                onClick={() => setInfoPage(IDeveloping)}
              >
                Lo Sviluppo
              </LinkButton>
            </li>
            <li>
              <LinkButton
                id="nav-back"
                onClick={() => appContext.ctx.globalNavigator?.("/home")}
              >
                Torna all'app
              </LinkButton>
            </li>
          </ul>
        </div>
        <div id="info">{infoPage}</div>
      </div>
    </motion.div>
  );
}
