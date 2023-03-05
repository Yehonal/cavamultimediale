import MatteoApicella from "./MatteoApicella";

export type HistorySubPages = Record<string, React.ReactNode | null>;

export const artistsRoutes: HistorySubPages = {
  matteo_apicella: MatteoApicella(),
  francesco_autoriello: null,
  antonio_baldo: null,
  alfonso_balzico: null,
  guglielmo_coppola: null,
  vincenzo_montefusco: null,
};

export const othersRoutes: HistorySubPages = {
  onofrio_de_giordano: null,
  suor_orsola_benincasa: null,
  lucia_apicella: null,
};

export const writersRoutes: HistorySubPages = {
  aniello_avallone: null,
  raffaele_baldi: null,
  giovanni_canale: null,
  matteo_della_corte: null,
  marco_galdi: null,
  tommaso_gaudiosi: null,
  michele_morcaldi: null,
  nunziante_pagano: null,
  gennaro_senatore: null,
  giuseppe_trezza: null,
};

export const heroesRoutes: HistorySubPages = {
  vincenzo_baldi: null,
  giovanni_bassi: null,
  pietro_carola: null,
  giovanbattista_castaldo: null,
  errico_de_marinis: null,
  nicola_di_mauro: null,
  carlo_filangieri: null,
  giulio_genoino: null,
  nunzio_genovese: null,
  giosue_e_marino_longo: null,
  sabato_martelli_castaldi: null,
  felice_parisi: null,
  luigi_parisi: null,
};

export const artists = Object.keys(artistsRoutes);
export const others = Object.keys(othersRoutes);
export const writers = Object.keys(writersRoutes);
export const heroes = Object.keys(heroesRoutes);

export const allHistoryRoutes: HistorySubPages = {
  ...artistsRoutes,
  ...othersRoutes,
  ...writersRoutes,
  ...heroesRoutes,
};
