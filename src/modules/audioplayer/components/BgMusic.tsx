import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BASENAME } from "../../../app.defs";

export interface IBgMusicContext {
  play: boolean;
  src: string;
  mute?: boolean;
}

export type BgMusicContextType = {
  music: IBgMusicContext;
  setMusic: {
    (ctx: IBgMusicContext | { (ctx: IBgMusicContext): IBgMusicContext }): void;
  };
  audio: HTMLAudioElement;
};

export const BgMusicContext = createContext({} as BgMusicContextType);

export function useMusicStatus() {
  const [audio] = useState(new Audio());

  const [music, setMusic] = useState<IBgMusicContext>({
    play: false,
    mute: false,
    src: "",
  });

  useEffect(() => {
    console.log("BgMusic: start muted");
    audio.pause(); // pause only the very first time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo(() => {
    return { music, setMusic, audio };
  }, [music, setMusic, audio]);
}

const BgMusic = ({ props }: { props: { audioPath: string } }) => {
  const audioContext = useContext<BgMusicContextType>(BgMusicContext);

  useEffect(() => {
    const audio = audioContext.audio;

    const newSrc = `${window.location.protocol}//${window.location.host}/${BASENAME}/${audioContext.music.src}`;

    if (audioContext.music.mute) {
      audio.pause();
      return;
    }

    if (audio.src === newSrc && audioContext.music.play && !audio.paused)
      return;

    audio.pause();
    if (audioContext.music.src && audioContext.music.play) {
      audio.src = newSrc;
      console.log("BgMusic: play:" + newSrc);
      audio.loop = true;
      audio.play();
    }
    return () => {
      console.log("BgMusic: unmounting", audioContext.music.play);
      // audio.pause();
    };
  }, [audioContext]);

  return null;
};

export default BgMusic;
