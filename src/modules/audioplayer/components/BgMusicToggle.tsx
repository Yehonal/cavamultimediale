import { useContext } from "react";
import { BgMusicContext, IBgMusicContext } from "./BgMusic";

import sound from "../../../data/media/images/vari/sound.png";
import no_sound from "../../../data/media/images/vari/no_sound.png";

export default function BgMusciToggle() {
  const { music, setMusic } = useContext(BgMusicContext);

  const toggleMusic = () => {
    console.log("toggleMusic: " + !music.mute);
    setMusic((music: IBgMusicContext) => ({
      ...music,
      mute: !music.mute,
    }));
  };

  return (
    <div className="bg-music-toggle">
      <img
        onClick={toggleMusic}
        src={music.mute ? no_sound : sound}
        alt="musicToggle"
      ></img>
    </div>
  );
}
