export const VELVET_KEY = import.meta.env.VITE_VELVET_KEY || "default-dev-key";

export type PaperKey =
  | "A5"
  | "A4"
  | "A3"
  | "A2"
  | "Letter"
  | "Tabloid"
  | "Mobile"
  | "Instagram"
  | "Twitter"
  | "FHD";
export type Orientation = "portrait" | "landscape";

export const DPI = 150;
export const MM_TO_INCH = 25.4;

export const getSizeFromMM = (mmW: number, mmH: number) => ({
  w: Math.floor((mmW / MM_TO_INCH) * DPI),
  h: Math.floor((mmH / MM_TO_INCH) * DPI),
});

export const PAPER_SIZES: Record<PaperKey, { w: number; h: number }> = {
  A5: getSizeFromMM(148, 210),
  A4: getSizeFromMM(210, 297),
  A3: getSizeFromMM(297, 420),
  A2: getSizeFromMM(420, 594),
  Letter: getSizeFromMM(215.9, 279.4),
  Tabloid: getSizeFromMM(279.4, 431.8),
  Mobile: { w: 390, h: 700 },
  Instagram: { w: 1080, h: 1080 },
  Twitter: { w: 1200, h: 675 },
  FHD: { w: 1920, h: 1080 },
};

export const ZOOM_PRESETS = [300, 200, 150, 100, 75, 50, 25, 10];
export const FONTS = [
  "Inter",
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
];
export const PRESET_COLORS = [
  "transparent",
  "#ffffff",
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#00FFFF",
  "#FF00FF",
  "#C0C0C0",
  "#808080",
  "#800000",
  "#800000",
  "#008000",
  "#800080",
  "#008080",
  "#000080",
];

export const HIGHLIGHT_COLORS = [
  "transparent",
  "#fef08a",
  "#bbf7d0",
  "#bfdbfe",
  "#fbcfe8",
  "#ddd6fe",
  "#f5f5f5",
];
