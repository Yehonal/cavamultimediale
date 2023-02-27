import StandardGallery from "../modules/gallery/components/StandardGallery";

import itext from "../data/media/text/cavaoggi/img/di.dat";
import etext from "../data/media/text/cavaoggi/img/de.dat";

export default function CityToday() {
  const IMG_COUNT = 44;
  const images: any[] = [];
  for (let i = 1; i <= IMG_COUNT; i++) {
    images.push(require(`../data/media/images/cavaoggi/img/t${i}.jpg`));
  }
  return (
    <>
      <StandardGallery images={images} itext={itext} etext={etext} />
    </>
  );
}
