import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface IBgMusicContext {
  play: boolean;
  src: string;
}

export type BgMusicContextType = {
  music: IBgMusicContext;
  setMusic: { (music: IBgMusicContext): void };
  audio: HTMLAudioElement;
};

export const BgMusicContext = createContext({} as BgMusicContextType);

export function useMusicStatus() {
  const [audio] = useState(new Audio());

  const [music, setMusic] = useState<IBgMusicContext>({
    play: false,
    src: "",
  });
  return useMemo(() => {
    audio.pause(); // pause only the very first time
    return { music, setMusic, audio };
  }, [music, setMusic, audio]);
}

const BgMusic = ({ props }: { props: { audioPath: string } }) => {
  const audioContext = useContext<BgMusicContextType>(BgMusicContext);

  useEffect(() => {
    const audio = audioContext.audio;

    audio.src = window.location.href + audioContext.music.src;
    audio.pause();
    if (audioContext.music.play) {
      audio.loop = true;
      audio.play();
    }
    return () => {
      audio.pause();
    };
  }, [audioContext]);

  return null;
};

export default BgMusic;
