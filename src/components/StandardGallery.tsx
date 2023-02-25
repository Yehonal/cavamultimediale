import "./StandardGallery.css";

import fdx from "../data/media/images/vari/fdx.bmp";
import fsx from "../data/media/images/vari/fsx.bmp";
import { useContext, useEffect, useState } from "react";
import { LanguageContext } from "./LanguageToggle";
import SubPageFooter from "./SubPageFooter";
import LinkButton from "./LinkButton";
import { motion } from "framer-motion";

export default function StandardGallery({
  images,
  itext,
  etext,
}: {
  images: string[];
  itext: any;
  etext: any;
}) {
  const { language } = useContext(LanguageContext);
  const [currentImage, setCurrentImage] = useState(0);

  const text = language === "e" ? etext : itext;

  const [centerText, setCenterText] = useState("");

  /**
   * Fetch the text file and set the center text
   */
  useEffect(() => {
    const headers = new Headers();
    headers.append(
      "Content-Type",
      "Content-type: text/plain; charset=iso-8859-1"
    );

    fetch(text, { headers })
      .then(function (response) {
        return response.arrayBuffer();
      })
      .then(function (buffer) {
        const decoder = new TextDecoder("iso-8859-1");
        return decoder.decode(buffer);
      })
      .then((data) => {
        const rows = data.split("\n");
        const text = rows[currentImage];
        setCenterText(text);
      });
  }, [text, currentImage]);

  const [h, setH] = useState(0);
  const [landHeight, setLandHeight] = useState(0);
  const [sideWidth, setSideWidth] = useState(0);

  /**
   * Set the image offsets for the gallery to make the image centered
   */
  const setImageOffsets = (el: HTMLImageElement) => {
    setH(el?.height ?? 0);
    setLandHeight((445 - el?.height) / 2);
    setSideWidth((634 - el?.width) / 2);
  };

  /**
   * Start the gallery
   */
  const [start, setStart] = useState(false);
  useEffect(() => {
    // set an interval timer if we are currently moused over
    if (start) {
      const timer = setInterval(() => {
        // cycle prevCount using mod instead of checking for hard-coded length
        setCurrentImage((currentImage) => (currentImage + 1) % images.length);
      }, 5000);
      // automatically clear timer the next time this effect is fired or
      // the component is unmounted
      return () => clearInterval(timer);
    }
    // the dependency on start means that this effect is fired
    // every time start changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  return (
    <>
      <motion.div
        style={{ position: "absolute", zIndex: 3 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{
          opacity: "1",
          width: "100%",
          scale: 1,
          transition: { duration: 1 },
        }}
        transition={{ duration: 0.5 }}
      >
        <div id="gallery-page">
          <div
            id="gallery-image-top"
            className="gallery-frame"
            style={{ height: `${landHeight + 1}px` }}
          ></div>
          <div
            id="gallery-page-center"
            style={{ height: `${h + landHeight + 1}px` }}
          >
            <div
              id="gallery-image-left"
              className="gallery-frame"
              style={{ width: `${sideWidth}px` }}
            ></div>
            <div id="gallery-image-wrapper">
              <div id="gallery-image-mask">
                <img
                  id="gallery-image"
                  src={images[currentImage]}
                  style={{ display: "block" }}
                  alt="cava"
                  onLoad={(event) => {
                    setImageOffsets(event.target as HTMLImageElement);
                  }}
                />
              </div>
            </div>
            <div
              id="gallery-image-right"
              className="gallery-frame"
              style={{ width: `${sideWidth}px` }}
            ></div>
          </div>
          <div id="gallery-controls-bar" className="gallery-frame">
            <div id="gallery-controls-left">
              {currentImage > 0 && (
                <button
                  id="gallery-go-prev"
                  className="link-button"
                  onClick={() => {
                    setCurrentImage(currentImage - 1);
                  }}
                >
                  <img src={fsx} alt="arrow" />
                </button>
              )}
            </div>
            <div id="gallery-controls-center">{centerText}</div>
            <div id="gallery-controls-right">
              {currentImage < images.length - 1 && (
                <button
                  id="gallery-go-next"
                  className="link-button"
                  onClick={() => {
                    setCurrentImage(currentImage + 1);
                  }}
                >
                  <img src={fdx} alt="arrow" />
                </button>
              )}
            </div>
          </div>
        </div>
        <SubPageFooter>
          <div id="gallery-start-div">
            <LinkButton id="gallery-start" onClick={() => setStart(!start)}>
              {start === true ? "Stop" : "Start"}
            </LinkButton>
          </div>
        </SubPageFooter>
      </motion.div>
    </>
  );
}
