import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import YouTube from "react-youtube";
import { AppContext } from "../AppContext";
import "./Intro.css";

const Intro = () => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);

  const goHome = () => {
    navigate("/home", { replace: false });
  };

  useEffect(() => {
    appContext.setAppCtx((ctx) => ({
      ...ctx,
      showSkipIntro: true,
    }));

    return () => {
      appContext.setAppCtx((ctx) => ({
        ...appContext.ctx,
        showSkipIntro: false,
      }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="intro-page" onClick={goHome}>
      <div id="intro">
        <div id="hwc_intro">
          <YouTube
            videoId="5C2SxUJjYEc"
            opts={{
              height: "480",
              width: "640",
              playerVars: {
                rel: 0,
                modestbranding: 1,
                showinfo: 1,
                autoplay: 1,
                controls: 0,
                disablekb: 1,
              },
            }}
            onPause={goHome}
            onEnd={goHome}
          ></YouTube>
        </div>
      </div>
    </div>
  );
};

export default Intro;
