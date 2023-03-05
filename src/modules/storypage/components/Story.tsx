import { motion } from "framer-motion";
import "./Story.css";

import imgMain from "../../../data/media/images/stor/imgmain.jpg";
import SubPageFooter from "../../footer/components/SubPageFooter";

import iPersTitle from "../../../data/media/images/pers/iz2.jpg";
import ePersTitle from "../../../data/media/images/pers/ez2.jpg";
import { useContext, useEffect, useState } from "react";
import { LanguageContext } from "../../home/components/LanguageToggle";
import getTextFromFile from "../../common/getTextFromFile";
import CopyButton from "../../common/components/CopyButton";

type PageType = "story" | "personage";

export default function Story({
  mainPicture,
  pageType,
  pageTitle,
  pageTextEn,
  pageTextIt,
}: {
  mainPicture: string;
  pageType: PageType;
  pageTitle: string;
  pageTextEn: string;
  pageTextIt: string;
}) {
  const { language } = useContext(LanguageContext);

  const [pageText, setPageText] = useState("");

  useEffect(() => {
    async function getPageText() {
      const text = await getTextFromFile(
        language === "e" ? pageTextEn : pageTextIt
      );
      setPageText(text);
    }
    getPageText();
  }, [language, pageTextEn, pageTextIt]);

  return (
    <motion.div
      style={{ position: "absolute", zIndex: 1 }}
      initial={{ width: "0%" }}
      animate={{ width: "100%", transition: { duration: 0 } }}
      exit={{
        width: "100%",
        zIndex: 0,
        transitionEnd: { display: "none" },
        transition: { duration: 1 },
      }}
    >
      <div
        id="story-page"
        className="page-div"
        style={{
          backgroundImage: `url(${imgMain})`,
        }}
      >
        <div id="story-header" style={{ width: "315px" }}>
          <img
            src={pageType === "story" ? ePersTitle : iPersTitle}
            alt="story"
          />
          <div
            id="story-header-text"
            style={{
              color: "#881A1A",
              position: "absolute",
              top: "78px",
              left: "176px",
              fontSize: "15px",
              fontWeight: "bold",
            }}
          >
            {pageTitle}
          </div>
        </div>
        <img
          src={mainPicture}
          alt="main"
          id="main-picture"
          style={{
            position: "absolute",
            top: "100px",
            left: "46px",
          }}
        ></img>
        <div
          id="pageButtons"
          style={{
            position: "absolute",
            top: "426px",
            left: "48px",
          }}
        >
          <CopyButton language={language} pageText={pageText}></CopyButton>
        </div>
        <div
          id="page-text"
          style={{
            position: "absolute",
            width: "289px",
            left: "330px",
            top: "7px",
            fontSize: "14px",
          }}
        >
          {pageText}
        </div>
      </div>
      <SubPageFooter />
    </motion.div>
  );
}
