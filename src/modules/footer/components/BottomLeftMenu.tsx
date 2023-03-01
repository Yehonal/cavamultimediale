import { useNavigate } from "react-router-dom";
import LinkButton from "../../common/components/LinkButton";

import ileftmenu from "../../../data/media/text/bottombar/ileftmenu.json";
import eleftmenu from "../../../data/media/text/bottombar/eleftmenu.json";
import { useContext } from "react";
import { LanguageContext } from "../../home/components/LanguageToggle";

export default function BottomLeftMenu() {
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();

  const json = language === "e" ? eleftmenu : ileftmenu;

  return (
    <>
      <div>
        <LinkButton
          className="bottom-link"
          onClick={() => {
            navigate(-1);
          }}
        >
          {json["back"]}
        </LinkButton>
      </div>
      <div>
        <LinkButton className="bottom-link" onClick={() => navigate("/home")}>
          {json["menu"]}
        </LinkButton>
      </div>
    </>
  );
}
