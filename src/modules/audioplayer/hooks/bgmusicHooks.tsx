import { useContext, useEffect } from "react";
import { BgMusicContext, IBgMusicContext } from "../../../components/BgMusic";

export function useCurrentBgMusic(src: string) {
  const bgMusic = useContext(BgMusicContext);
  useEffect(() => {
    bgMusic.setMusic((music: IBgMusicContext) => ({
      ...music,
      play: true,
      src,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
