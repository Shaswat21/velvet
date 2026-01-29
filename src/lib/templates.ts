import { nanoid } from "nanoid";
import CryptoJS from "crypto-js";
import type { Orientation, PaperKey } from "@/lib/constants";
import type { CanvasObject } from "@/lib/types";
import { VELVET_KEY } from "@/lib/constants";

export interface Template {
  id: string;
  name: string;
  category: string;
  paper: PaperKey;
  orientation: Orientation;
  bgColor: string;
  objects: CanvasObject[];
  thumbnail?: string;
}

// --- 1. DEFAULT TEMPLATES (Static) ---
// const DEFAULT_TEMPLATES: Template[] = [
//   {
//     id: "instagram-quote",
//     name: "Instagram Quote",
//     category: "Social Media",
//     paper: "Instagram",
//     orientation: "portrait",
//     bgColor: "#FDF4FF",
//     objects: [
//       {
//         id: nanoid(),
//         type: "rect",
//         x: 100,
//         y: 100,
//         width: 880,
//         height: 880,
//         rotation: 0,
//         fillColor: "transparent",
//         strokeColor: "#000000",
//         strokeWidth: 4,
//         borderRadius: 0,
//       },
//       {
//         id: nanoid(),
//         type: "text",
//         x: 140,
//         y: 400,
//         width: 800,
//         height: 200,
//         rotation: 0,
//         text: "Make it simple,\nbut significant.",
//         fontSize: 80,
//         fontFamily: "Inter",
//         color: "#1a1a1a",
//         isBold: true,
//         isItalic: false,
//         isUnderline: false,
//         isStrikethrough: false,
//         textAlign: "center",
//         backgroundColor: "transparent",
//         textTransform: "none",
//         letterSpacing: 0,
//         lineHeight: 1.2,
//       },
//     ],
//   },
//   {
//     id: "business-card-modern",
//     name: "Modern Business Card",
//     category: "Business",
//     paper: "A5",
//     orientation: "landscape",
//     bgColor: "#18181b",
//     objects: [
//       {
//         id: nanoid(),
//         type: "rect",
//         x: 0,
//         y: 0,
//         width: 300,
//         height: 594,
//         rotation: 0,
//         fillColor: "#facc15",
//         strokeColor: "transparent",
//         strokeWidth: 0,
//         borderRadius: 0,
//       },
//       {
//         id: nanoid(),
//         type: "text",
//         x: 350,
//         y: 150,
//         width: 400,
//         height: 60,
//         rotation: 0,
//         text: "Jane Doe",
//         fontSize: 48,
//         fontFamily: "Inter",
//         color: "#ffffff",
//         isBold: true,
//         isItalic: false,
//         isUnderline: false,
//         isStrikethrough: false,
//         textAlign: "left",
//         backgroundColor: "transparent",
//         textTransform: "none",
//         letterSpacing: 1,
//         lineHeight: 1,
//       },
//       {
//         id: nanoid(),
//         type: "text",
//         x: 350,
//         y: 210,
//         width: 400,
//         height: 40,
//         rotation: 0,
//         text: "Creative Director",
//         fontSize: 24,
//         fontFamily: "Inter",
//         color: "#a1a1aa",
//         isBold: false,
//         isItalic: false,
//         isUnderline: false,
//         isStrikethrough: false,
//         textAlign: "left",
//         backgroundColor: "transparent",
//         textTransform: "none",
//         letterSpacing: 0,
//         lineHeight: 1,
//       },
//     ],
//   },
// ];

// --- 2. DYNAMIC IMPORT LOGIC (LAZY) ---
// This creates a registry of functions: { "path": () => import(...) }
// It DOES NOT load the files yet.
const templateFiles = import.meta.glob("@/assets/templates/*.velvet", {
  query: "?raw",
  import: "default",
  eager: false, // Lazy load: only fetch when called
});

export const fetchTemplates = async (): Promise<Template[]> => {
  const loadedTemplates: Template[] = [];

  // Iterate over the file paths and load them one by one (or in parallel)
  const loadPromises = Object.entries(templateFiles).map(
    async ([path, loader]) => {
      try {
        const encryptedContent = await loader(); // Fetch file content

        const bytes = CryptoJS.AES.decrypt(
          encryptedContent as string,
          VELVET_KEY
        );
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedString) {
          console.warn(`Could not decrypt template: ${path}`);
          return null;
        }

        const data = JSON.parse(decryptedString);

        return {
          id: data.id || nanoid(),
          name: data.name || "Untitled Template",
          category: data.category || "Imported",
          paper: data.paper || "A4",
          orientation: data.orientation || "portrait",
          bgColor: data.bgColor || "#ffffff",
          objects: data.objects || [],
          thumbnail: data.thumbnail,
        } as Template;
      } catch (e) {
        console.error(`Error loading template from ${path}:`, e);
        return null;
      }
    }
  );

  const results = await Promise.all(loadPromises);

  // Filter out nulls
  results.forEach((t) => {
    if (t) loadedTemplates.push(t);
  });

  // return [...DEFAULT_TEMPLATES, ...loadedTemplates];
  return []; // Temporarily disable default templates];
};
