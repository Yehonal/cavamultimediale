import scrollUp from "../data/media/images/vari/fup.png";
import scrollDown from "../data/media/images/vari/fdown.png";
import { RefObject } from "react";

export default function BlackScrollArrows({
  textRef,
}: {
  textRef: RefObject<unknown>;
}) {
  let scroll = 15,
    speed = 150,
    int00: NodeJS.Timer;

  return (
    <>
      <img
        id="city-text-scroll-up"
        src={scrollUp}
        alt="scrollUp"
        onMouseDown={() => {
          const ele: HTMLDivElement = textRef.current as HTMLDivElement; // take the risk of null

          ele.scrollTop -= scroll; // first scroll at click
          int00 = setInterval(() => {
            ele.scrollTop -= scroll;
          }, speed);
        }}
        onMouseUp={() => {
          clearInterval(int00);
        }}
        onMouseOut={() => {
          clearInterval(int00);
        }}
      />
      <img
        id="city-text-scroll-up"
        src={scrollDown}
        alt="scrollDown"
        onMouseDown={() => {
          const ele: HTMLDivElement = textRef.current as HTMLDivElement; // take the risk of null
          ele.scrollTop += scroll; // first scroll at click
          int00 = setInterval(() => {
            ele.scrollTop += scroll;
          }, speed);
        }}
        onMouseUp={() => {
          clearInterval(int00);
        }}
        onMouseOut={() => {
          clearInterval(int00);
        }}
      />
    </>
  );
}
