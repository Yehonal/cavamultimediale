import header1 from "../data/media/images/main/1.bmp";
import header2 from "../data/media/images/main/2.bmp";
import header3 from "../data/media/images/main/3.bmp";
import header4 from "../data/media/images/main/4.bmp";
import header5 from "../data/media/images/main/5.bmp";
import header6 from "../data/media/images/main/6.bmp";
import header7 from "../data/media/images/main/7.bmp";
import header8 from "../data/media/images/main/8.bmp";
import header9 from "../data/media/images/main/9.bmp";
import header10 from "../data/media/images/main/10.bmp";
import { useMemo, useEffect, useState } from "react";

/**
 * Keep this component separate from the rest of the app for performance reasons
 */
export default function HomeSky() {
  const headerImages: React.ElementType[] = useMemo(
    () => [
      ({ display }) => (
        <img src={header1} alt="sky" style={{ display }} key="1" />
      ),
      ({ display }) => (
        <img src={header2} alt="sky" style={{ display }} key="2" />
      ),
      ({ display }) => (
        <img src={header3} alt="sky" style={{ display }} key="3" />
      ),
      ({ display }) => (
        <img src={header4} alt="sky" style={{ display }} key="4" />
      ),
      ({ display }) => (
        <img src={header5} alt="sky" style={{ display }} key="5" />
      ),
      ({ display }) => (
        <img src={header6} alt="sky" style={{ display }} key="6" />
      ),
      ({ display }) => (
        <img src={header7} alt="sky" style={{ display }} key="7" />
      ),
      ({ display }) => (
        <img src={header8} alt="sky" style={{ display }} key="8" />
      ),
      ({ display }) => (
        <img src={header9} alt="sky" style={{ display }} key="9" />
      ),
      ({ display }) => (
        <img src={header10} alt="sky" style={{ display }} key="10" />
      ),
    ],
    []
  );

  const [currentImage, setCurrentImage] = useState({
    index: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentImage.index === headerImages.length - 1) {
        setCurrentImage({ index: 0 });
      } else {
        setCurrentImage({
          index: currentImage.index + 1,
        });
      }
    }, 200);
    return () => clearInterval(interval);
  }, [currentImage, headerImages]);

  return (
    <>
      {headerImages.map((Image, index) => (
        <Image
          display={currentImage.index === index ? "block" : "none"}
          key={index}
        />
      ))}
    </>
  );
}
