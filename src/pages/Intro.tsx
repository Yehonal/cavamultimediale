import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import { AppContext } from "../AppContext";
import "./Intro.css";
import { BgMusicContext } from "../modules/audioplayer/components/BgMusic";

const Intro = () => {
  const bgMusic = useContext(BgMusicContext);
  console.log("Init intro page");

  useEffect(() => {
    bgMusic.setMusic({ play: false, src: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useNavigate();
  const appContext = useContext(AppContext);

  const [start, setStart] = useState(false);

  const goHome = () => {
    if (!start) {
      setStart(true);
      return;
    }

    // second time we click, we skip the intro
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
          <ReactPlayer
            url={`${window.location.href}/AVI/0.webm`}
            loop={false}
            muted={false}
            playing={start}
            controls={!start}
            onPlay={() => setStart(true)}
            //url="https://www.youtube.com/watch?v=5C2SxUJjYEc"
            // config={{
            //   youtube: {
            //     playerVars: {
            //       rel: 0,
            //       modestbranding: 1,
            //       showinfo: 1,
            //       autoplay: 1,
            //       controls: 0,
            //       disablekb: 1,
            //     },
            //   },
            // }}
            height="480px"
            width="640px"
            onPause={goHome}
            onEnded={goHome}
          ></ReactPlayer>
        </div>
      </div>
    </div>
  );
};

export default Intro;
