import { useContext } from "react";
import { BgMusicContext } from "./BgMusic";

import sound from "../data/media/images/vari/sound.png";
import no_sound from "../data/media/images/vari/no_sound.png";

export default function BgMusciToggle() {
  const { music, setMusic } = useContext(BgMusicContext);

  const toggleMusic = () => {
    setMusic({ ...music, play: !music.play });
  };

  return (
    <div className="bg-music-toggle">
      <img
        onClick={toggleMusic}
        src={music.play ? sound : no_sound}
        alt="musicToggle"
      ></img>
    </div>
  );
}
