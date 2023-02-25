import StandardGallery from "../components/StandardGallery";

import itext from "../data/media/text/cavaieri/img/di.dat";
import etext from "../data/media/text/cavaieri/img/de.dat";

export default function CityYesterday() {
  const IMG_COUNT = 84;
  const images: any[] = [];
  for (let i = 1; i <= IMG_COUNT; i++) {
    images.push(require(`../data/media/images/cavaieri/img/${i}.jpg`));
  }
  return (
    <>
      <StandardGallery images={images} itext={itext} etext={etext} />
    </>
  );
}
