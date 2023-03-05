import Story from "../../modules/storypage/components/Story";

import mainPicture from "../../data/media/images/pers/pe7.jpg";
import ePageText from "../../data/media/text/pers/epe7.txt";
import iPageText from "../../data/media/text/pers/ipe7.txt";

export default function MatteoApicella() {
  return (
    <Story
      mainPicture={mainPicture}
      pageType="personage"
      pageTitle="Matteo Apicella"
      pageTextEn={ePageText}
      pageTextIt={iPageText}
    />
  );
}
