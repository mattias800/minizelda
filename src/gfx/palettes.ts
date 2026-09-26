import type { Palette } from "./pixelart";

/** Named colors. Loosely based on the NES palette with a few softer tones. */
export const COLOR = {
  black: "#000000",
  outline: "#181010",
  white: "#fcfcfc",
  grey: "#8c8c9c",
  lightGrey: "#c8c8d0",
  darkGrey: "#4c4c5c",
  red: "#d82800",
  darkRed: "#881400",
  pink: "#fc7460",
  orange: "#fc9838",
  yellow: "#f8d878",
  gold: "#f8b800",
  skin: "#fcbc74",
  brown: "#b8581c",
  darkBrown: "#6c2c08",
  green: "#80d010",
  darkGreen: "#3a8a10",
  blue: "#2c6cd8",
  lightBlue: "#7cbcfc",
  navy: "#1c2c88",
  purple: "#8038b8",
} as const;

export const HERO: Palette = {
  k: COLOR.outline,
  g: COLOR.green,
  G: COLOR.darkGreen,
  s: COLOR.skin,
  h: COLOR.brown,
  y: COLOR.yellow,
  e: COLOR.grey,
  w: COLOR.white,
};

export const FOLIAGE: Palette = {
  k: "#0c2c0c",
  l: "#5cb838",
  t: "#2c8a2c",
  T: "#146018",
  b: COLOR.brown,
};

export const BUSH: Palette = {
  k: "#0c3c10",
  l: "#b0e860",
  t: "#6cc038",
  T: "#3c8c28",
};

export const CLIFF: Palette = {
  k: "#401808",
  h: "#e8a060",
  o: "#d07830",
  b: "#a8501c",
  d: "#7a3410",
};

export const STONE: Palette = {
  k: "#20202c",
  w: "#e8e8f0",
  E: "#b8b8c8",
  e: "#88889c",
  d: "#5c5c70",
};

export const RED_ENEMY: Palette = {
  k: COLOR.outline,
  r: COLOR.red,
  R: COLOR.darkRed,
  w: COLOR.white,
};

export const BLUE_ENEMY: Palette = {
  ...RED_ENEMY,
  r: COLOR.blue,
  R: COLOR.navy,
};

export const PICKUP: Palette = {
  k: COLOR.outline,
  r: COLOR.red,
  R: COLOR.darkRed,
  w: COLOR.white,
  g: COLOR.green,
  G: COLOR.darkGreen,
  y: COLOR.gold,
  Y: COLOR.yellow,
  o: COLOR.orange,
  b: COLOR.brown,
  e: COLOR.grey,
  E: COLOR.lightGrey,
};
