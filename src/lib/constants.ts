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
  ]
};

// Flattened list for backward compatibility and validation
export const FONTS = Object.values(FONT_GROUPS).flat().sort();

// -------------------------------------------------------
// Per-language Indian fonts (loaded dynamically on demand)
// Keyed by transliteration language code from useTransliteration.ts
// -------------------------------------------------------
export type IndianLanguageCode =
  | 'hi-t-i0-und'
  | 'mr-t-i0-und'
  | 'ne-t-i0-und'
  | 'sa-t-i0-und'
  | 'bn-t-i0-und'
  | 'gu-t-i0-und'
  | 'kn-t-i0-und'
  | 'ml-t-i0-und'
  | 'pa-t-i0-und'
  | 'ta-t-i0-und'
  | 'te-t-i0-und'
  | 'ur-t-i0-und';

export interface IndianFontMeta {
  family: string;       // CSS font-family name
  label: string;        // Display label
  style: string;        // e.g. "Serif", "Handwriting", "Display"
  googleName?: string;  // Google Fonts URL name (if different from family)
}

export const SCRIPT_SAMPLES: Record<IndianLanguageCode, string> = {
  'hi-t-i0-und': 'हिन्दी',
  'mr-t-i0-und': 'मराठी',
  'ne-t-i0-und': 'नेपाली',
  'sa-t-i0-und': 'संस्कृत',
  'bn-t-i0-und': 'বাংলা',
  'gu-t-i0-und': 'ગુજરાતી',
  'kn-t-i0-und': 'ಕನ್ನಡ',
  'ml-t-i0-und': 'മലയാളം',
  'pa-t-i0-und': 'ਪੰਜਾਬੀ',
  'ta-t-i0-und': 'தமிழ்',
  'te-t-i0-und': 'తెలుగు',
  'ur-t-i0-und': 'اردو',
};

export const INDIAN_LANGUAGE_FONTS: Record<IndianLanguageCode, IndianFontMeta[]> = {

  // ── Hindi / Devanagari ──────────────────────────────────────────
  'hi-t-i0-und': [
    { family: 'Tiro Devanagari Hindi',    label: 'Tiro',         style: 'Serif' },
    { family: 'Hind',                      label: 'Hind',         style: 'Sans' },
    { family: 'Rozha One',                 label: 'Rozha One',    style: 'Display' },
    { family: 'Yatra One',                 label: 'Yatra One',    style: 'Display' },
    { family: 'Khand',                     label: 'Khand',        style: 'Condensed' },
    { family: 'Noto Serif Devanagari',     label: 'Noto Serif',   style: 'Serif' },
    { family: 'Noto Sans Devanagari',      label: 'Noto Sans',    style: 'Sans' },
    { family: 'Martel',                    label: 'Martel',       style: 'Serif' },
    { family: 'Kalam',                     label: 'Kalam',        style: 'Handwriting' },
    { family: 'Teko',                      label: 'Teko',         style: 'Bold Display' },
    { family: 'Rajdhani',                  label: 'Rajdhani',     style: 'Industrial' },
  ],

  // ── Marathi — Devanagari script ─────────────────────────────────
  'mr-t-i0-und': [
    { family: 'Tiro Devanagari Hindi',     label: 'Tiro',         style: 'Serif' },
    { family: 'Hind',                      label: 'Hind',         style: 'Sans' },
    { family: 'Rozha One',                 label: 'Rozha One',    style: 'Display' },
    { family: 'Yatra One',                 label: 'Yatra One',    style: 'Display' },
    { family: 'Noto Serif Devanagari',     label: 'Noto Serif',   style: 'Serif' },
    { family: 'Noto Sans Devanagari',      label: 'Noto Sans',    style: 'Sans' },
    { family: 'Martel',                    label: 'Martel',       style: 'Serif' },
    { family: 'Khand',                     label: 'Khand',        style: 'Condensed' },
  ],

  // ── Nepali — Devanagari script ─────────────────────────────────
  'ne-t-i0-und': [
    { family: 'Tiro Devanagari Hindi',    label: 'Tiro',         style: 'Serif' },
    { family: 'Hind',                      label: 'Hind',         style: 'Sans' },
    { family: 'Noto Serif Devanagari',     label: 'Noto Serif',   style: 'Serif' },
    { family: 'Noto Sans Devanagari',      label: 'Noto Sans',    style: 'Sans' },
    { family: 'Rozha One',                 label: 'Rozha One',    style: 'Display' },
    { family: 'Martel',                    label: 'Martel',       style: 'Serif' },
    { family: 'Yatra One',                 label: 'Yatra One',    style: 'Display' },
  ],

  // ── Sanskrit — Devanagari script ────────────────────────────────
  'sa-t-i0-und': [
    { family: 'Tiro Devanagari Hindi',     label: 'Tiro',         style: 'Serif' },
    { family: 'Noto Serif Devanagari',     label: 'Noto Serif',   style: 'Serif' },
    { family: 'Martel',                    label: 'Martel',       style: 'Serif' },
    { family: 'Hind',                      label: 'Hind',         style: 'Sans' },
    { family: 'Noto Sans Devanagari',      label: 'Noto Sans',    style: 'Sans' },
    { family: 'Rozha One',                 label: 'Rozha One',    style: 'Display' },
    { family: 'Yatra One',                 label: 'Yatra One',    style: 'Display' },
  ],

  // ── Bengali ───────────────────────────────────────────────────
  'bn-t-i0-und': [
    { family: 'Tiro Bangla',               label: 'Tiro Bangla',  style: 'Serif' },
    { family: 'Hind Siliguri',             label: 'Hind Siliguri',style: 'Sans' },
    { family: 'Noto Sans Bengali',         label: 'Noto Sans',    style: 'Sans' },
    { family: 'Noto Serif Bengali',        label: 'Noto Serif',   style: 'Serif' },
    { family: 'Atma',                      label: 'Atma',         style: 'Display' },
    { family: 'Galada',                    label: 'Galada',       style: 'Script' },
    { family: 'Anek Bangla',               label: 'Anek Bangla',  style: 'Display' },
    { family: 'Mina',                      label: 'Mina',         style: 'Sans' },
  ],

  // ── Gujarati ──────────────────────────────────────────────────
  'gu-t-i0-und': [
    { family: 'Noto Sans Gujarati',        label: 'Noto Sans',    style: 'Sans' },
    { family: 'Noto Serif Gujarati',       label: 'Noto Serif',   style: 'Serif' },
    { family: 'Hind Vadodara',             label: 'Hind Vadodara',style: 'UI Sans' },
    { family: 'Mukta Vaani',               label: 'Mukta Vaani',  style: 'Humanist Sans' },
    { family: 'Mogra',                     label: 'Mogra',        style: 'Script Display' },
    { family: 'Anek Gujarati',             label: 'Anek',         style: 'Variable Display' },
    { family: 'Rasa',                      label: 'Rasa',         style: 'Serif' },
    { family: 'Shrikhand',                 label: 'Shrikhand',    style: 'Display' },
    { family: 'Farsan',                    label: 'Farsan',       style: 'Decorative Display' },
    { family: 'Kumar One',                 label: 'Kumar One',    style: 'Bold Display' },
  ],

  // ── Kannada ───────────────────────────────────────────────────
  'kn-t-i0-und': [
    { family: 'Tiro Kannada',              label: 'Tiro',         style: 'Serif' },
    { family: 'Noto Sans Kannada',         label: 'Noto Sans',    style: 'Sans' },
    { family: 'Noto Serif Kannada',        label: 'Noto Serif',   style: 'Serif' },
    { family: 'Akaya Kanadaka',            label: 'Akaya',        style: 'Display' },
    { family: 'Anek Kannada',              label: 'Anek',         style: 'Display' },
    { family: 'Padyakke Expanded One',     label: 'Padyakke',     style: 'Display' },
    { family: 'Benne',                     label: 'Benne',        style: 'Serif' },
    { family: 'Hubballi',                  label: 'Hubballi',     style: 'Modern' },
    { family: 'Noto Sans Kannada UI',      label: 'Noto UI',      style: 'Sans' },
  ],

  // ── Malayalam ─────────────────────────────────────────────────
  'ml-t-i0-und': [
    { family: 'Tiro Malayalam',            label: 'Tiro',         style: 'Serif' },
    { family: 'Noto Sans Malayalam',       label: 'Noto Sans',    style: 'Sans' },
    { family: 'Noto Serif Malayalam',      label: 'Noto Serif',   style: 'Serif' },
    { family: 'Manjari',                   label: 'Manjari',      style: 'Rounded' },
    { family: 'Chilanka',                  label: 'Chilanka',     style: 'Handwriting' },
    { family: 'Gayathri',                  label: 'Gayathri',     style: 'Display' },
    { family: 'Anek Malayalam',            label: 'Anek',         style: 'Display' },
    { family: 'Uroob',                     label: 'Uroob',        style: 'Script' },
  ],

  // ── Punjabi (Gurmukhi) ────────────────────────────────────────
  'pa-t-i0-und': [
    { family: 'Tiro Gurmukhi',             label: 'Tiro',         style: 'Serif' },
    { family: 'Noto Sans Gurmukhi',        label: 'Noto Sans',    style: 'Sans' },
    { family: 'Noto Serif Gurmukhi',       label: 'Noto Serif',   style: 'Serif' },
    { family: 'Mukta Mahee',               label: 'Mukta',        style: 'Sans' },
    { family: 'Anek Gurmukhi',             label: 'Anek',         style: 'Display' },
    { family: 'Sahitya',                   label: 'Sahitya',      style: 'Serif' },
    { family: 'Glegoo',                    label: 'Glegoo',       style: 'Slab' },
    { family: 'Fira Sans Condensed',       label: 'Fira',         style: 'Condensed' },
  ],

  // ── Tamil ─────────────────────────────────────────────────────
  'ta-t-i0-und': [
    { family: 'Tiro Tamil',                label: 'Tiro Tamil',   style: 'Serif' },
    { family: 'Noto Sans Tamil',           label: 'Noto Sans',    style: 'Sans' },
    { family: 'Noto Serif Tamil',          label: 'Noto Serif',   style: 'Serif' },
    { family: 'Hind Madurai',              label: 'Hind Madurai', style: 'Sans' },
    { family: 'Mukta Malar',               label: 'Mukta Malar',  style: 'Sans' },
    { family: 'Kavivanar',                 label: 'Kavivanar',    style: 'Handwriting' },
    { family: 'Anek Tamil',                label: 'Anek Tamil',   style: 'Display' },
    { family: 'Meera Inimai',              label: 'Meera Inimai', style: 'Sans' },
    { family: 'Catamaran',                 label: 'Catamaran',    style: 'Sans' },
    { family: 'Arima',                     label: 'Arima',        style: 'Rounded' },
  ],

  // ── Telugu ────────────────────────────────────────────────────
  'te-t-i0-und': [
    { family: 'Tiro Telugu',               label: 'Tiro',         style: 'Serif' },
    { family: 'Noto Sans Telugu',          label: 'Noto Sans',    style: 'Sans' },
    { family: 'Noto Serif Telugu',         label: 'Noto Serif',   style: 'Serif' },
    { family: 'Hind Guntur',               label: 'Hind',         style: 'Sans' },
    { family: 'Anek Telugu',               label: 'Anek',         style: 'Display' },
    { family: 'Tenali Ramakrishna',        label: 'Tenali',       style: 'Serif' },
    { family: 'Peddana',                   label: 'Peddana',      style: 'Decorative' },
    { family: 'Dhurjati',                  label: 'Dhurjati',     style: 'Stylized' },
    { family: 'Suranna',                   label: 'Suranna',      style: 'Classic' },
    { family: 'Ramabhadra',                label: 'Ramabhadra',   style: 'Block' },
  ],

  // ── Urdu (Nastaliq) ───────────────────────────────────────────
  'ur-t-i0-und': [
    { family: 'Noto Nastaliq Urdu',        label: 'Noto Nastaliq',style: 'Nastaliq' },
    { family: 'Gulzar',                    label: 'Gulzar',       style: 'Nastaliq' },
    { family: 'Lateef',                    label: 'Lateef',       style: 'Nastaliq' },
    { family: 'Noto Sans Arabic',          label: 'Noto Sans',    style: 'Sans' },
    { family: 'Amiri',                     label: 'Amiri',        style: 'Serif' },
    { family: 'Scheherazade New',          label: 'Scheherazade', style: 'Serif' },
    { family: 'Reem Kufi',                 label: 'Reem Kufi',    style: 'Display' },
    { family: 'Mirza',                     label: 'Mirza',        style: 'Decorative' },
    { family: 'Aref Ruqaa',                label: 'Aref Ruqaa',   style: 'Script' },
    { family: 'Jomhuria',                  label: 'Jomhuria',     style: 'Bold Display' },
    { family: 'Harmattan',                 label: 'Harmattan',    style: 'Modern' },
  ],
};

// Build a Google Fonts import URL for a set of font families
export const buildGoogleFontsUrl = (families: string[]): string => {
  const params = families
    .map(f => `family=${encodeURIComponent(f)}:wght@400;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
};
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
