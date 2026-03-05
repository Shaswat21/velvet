export const ENABLE_DEV_MODE = true;

export const VELVET_KEY = import.meta.env.VITE_VELVET_KEY || "default-dev-key";

export type PaperKey =
  | "A5"
  | "A4"
  | "A3"
  | "A2"
  | "Letter"
  | "Invitation Card"
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
  "Invitation Card": { w: 1080, h: 1920 },
  Tabloid: getSizeFromMM(279.4, 431.8),
  Mobile: { w: 390, h: 700 },
  Instagram: { w: 1080, h: 1080 },
  Twitter: { w: 1200, h: 675 },
  FHD: { w: 1920, h: 1080 },
};

export const ZOOM_PRESETS = [300, 200, 150, 100, 75, 50, 25, 10];
// Font Groups for organized display
export const FONT_GROUPS = {
  "Handwritten & Script": [
    "Allura",
    "Amatic SC",
    "Brush Script MT",
    "Caveat",
    "Dancing Script",
    "Great Vibes",
    "Kalam", // Indian/Latin
    "Lucida Handwriting",
    "Pacifico",
    "Pinyon Script",
    "Sacramento",
    "Satisfy",
  ],
  "Sans Serif": [
    "Arial",
    "Baloo 2", // Indian/Latin
    "Fira Code", // Monospace
    "Gill Sans",
    "Helvetica",
    "Impact",
    "Inter",
    "Lato",
    "Lucida Console",
    "Menlo",
    "Monaco",
    "Montserrat",
    "Nunito",
    "Open Sans",
    "Poppins",
    "Quicksand",
    "Raleway",
    "Roboto",
    "Tahoma",
    "Trebuchet MS",
    "Verdana",
  ],
  "Serif": [
    "Bodoni Moda",
    "Bookman",
    "Cinzel",
    "Copperplate",
    "Cormorant Garamond",
    "Courier",
    "Courier New",
    "Garamond",
    "Georgia",
    "Lora",
    "Merriweather",
    "Palatino",
    "Papyrus",
    "Playfair Display",
    "Times New Roman",
  ],
  "Indian Languages": [
    "Tiro Devanagari Hindi", // Hindi, Marathi, Sanskrit
    "Tiro Bangla",          // Bengali, Assamese
    "Tiro Tamil",           // Tamil
    "Tiro Telugu",          // Telugu
    "Tiro Kannada",         // Kannada
    "Tiro Malayalam",       // Malayalam
    "Tiro Gurmukhi",        // Punjabi
    "Noto Sans Gujarati",   // Gujarati
  ]
};

// Flattened list for backward compatibility and validation
export const FONTS = Object.values(FONT_GROUPS).flat().sort();
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
