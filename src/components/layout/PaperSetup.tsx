import { useState, useRef } from "react";
import CryptoJS from "crypto-js";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowRight, FileText, Upload, LayoutTemplate } from "lucide-react";
import type { Orientation, PaperKey } from "@/pages/Home";
import type { CanvasObject } from "@/lib/types";
// CHANGED: Import PAPER_SIZES here to use the shared source of truth
import { VELVET_KEY, PAPER_SIZES } from "@/lib/constants";

// Map keys to UI labels (since PAPER_SIZES only has dimensions)
const PAPER_LABELS: Record<PaperKey, string> = {
  A5: "A5",
  A4: "A4",
  A3: "A3",
  A2: "A2",
  Letter: "Letter",
  Tabloid: "Tabloid",
  Instagram: "Instagram",
  Twitter: "Twitter",
  FHD: "Full HD",
};

export interface ImportedDesignData {
  paper: PaperKey;
  orientation: Orientation;
  objects: CanvasObject[];
  bgColor?: string;
}

interface PaperSetupProps {
  onStart: (paper: PaperKey, orientation: Orientation) => void;
  onImport: (data: ImportedDesignData) => void;
  onTemplates?: () => void;
}

export default function PaperSetup({
  onStart,
  onImport,
  onTemplates,
}: PaperSetupProps) {
  const [paper, setPaper] = useState<PaperKey>("A4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CHANGED: Use the imported PAPER_SIZES
  const baseSize = PAPER_SIZES[paper];
  const width = orientation === "portrait" ? baseSize.w : baseSize.h;
  const height = orientation === "portrait" ? baseSize.h : baseSize.w;
  const ratio = width / height;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let content = e.target?.result as string;
        let data;

        // --- DECRYPTION ---
        if (file.name.toLowerCase().endsWith(".velvet")) {
          try {
            const bytes = CryptoJS.AES.decrypt(content, VELVET_KEY);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            if (!decryptedString) throw new Error("Decryption failed or empty");
            data = JSON.parse(decryptedString);
          } catch (err) {
            throw new Error("Invalid or corrupted Velvet project file.");
          }
        } else {
          // Fallback to standard JSON
          data = JSON.parse(content);
        }

        if (!data.paper || !data.orientation || !Array.isArray(data.objects)) {
          throw new Error("Missing required fields.");
        }

        onImport({
          paper: data.paper,
          orientation: data.orientation,
          objects: data.objects,
          bgColor: data.bgColor || "#ffffff",
        });

        toast.success("Design imported successfully");
      } catch (error) {
        console.error("Import Error:", error);
        toast.error("Failed to import design", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-xl grid md:grid-cols-2 overflow-hidden">
        {/* Left Side - Visual Preview */}
        <div className="bg-gray-100 flex flex-col items-center justify-center p-10 relative overflow-hidden min-h-100 ml-6 rounded-sm">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div
            className="bg-white shadow-2xl border border-gray-200 relative transition-all duration-500 ease-in-out flex items-center justify-center"
            style={{
              width: ratio > 1 ? "240px" : `${240 * ratio}px`,
              height: ratio > 1 ? `${240 / ratio}px` : "240px",
            }}
          >
            <div className="absolute inset-4 border border-dashed border-gray-200" />
            <div className="text-gray-300 flex flex-col items-center gap-1">
              <FileText className="h-8 w-8" />
              <span className="text-xs font-mono">
                {width} x {height} px
              </span>
            </div>
          </div>
          <p className="absolute bottom-6 text-xs text-gray-500 font-medium uppercase tracking-widest">
            Preview
          </p>
        </div>

        {/* Right Side - Controls */}
        <div className="flex flex-col h-full border-l bg-white">
          <CardHeader className="mb-4">
            <CardTitle>New Design</CardTitle>
            <CardDescription>
              Configure your canvas settings or import a saved file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">Paper Size</label>
              <Select
                value={paper}
                onValueChange={(v) => setPaper(v as PaperKey)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Iterate over the imported PAPER_SIZES keys */}
                  {(Object.keys(PAPER_SIZES) as PaperKey[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {PAPER_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Orientation</label>
              <Tabs
                value={orientation}
                onValueChange={(v) => setOrientation(v as Orientation)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="portrait">Portrait</TabsTrigger>
                  <TabsTrigger value="landscape">Landscape</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
          <CardFooter className="border-t p-6 bg-gray-50/50 pb-0 flex-col gap-3">
            <Button
              className="w-full"
              size="lg"
              onClick={() => onStart(paper, orientation)}
            >
              Create Canvas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="relative w-full py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 px-2 text-gray-500">Or</span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".velvet,.json,application/json,application/velvet"
              onChange={handleFileUpload}
            />
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="ml-2 h-4 w-4" /> Import Project
            </Button>

            <Button
              className="w-full text-gray-500"
              size="sm"
              variant="ghost"
              onClick={onTemplates}
            >
              <LayoutTemplate className="mr-2 h-4 w-4" /> Select from Templates
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
