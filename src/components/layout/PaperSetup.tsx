import { useState } from "react";
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
import { ArrowRight, FileText } from "lucide-react";
import type { Orientation, PaperKey } from "@/pages/Design";

// Constants for preview aspect ratios
const SIZES: Record<PaperKey, { w: number; h: number; label: string }> = {
  A5: { w: 148, h: 210, label: "A5" },
  A4: { w: 210, h: 297, label: "A4" },
  A3: { w: 297, h: 420, label: "A3" },
  A2: { w: 420, h: 594, label: "A2" },
  Letter: { w: 216, h: 279, label: "Letter" },
  Tabloid: { w: 279, h: 432, label: "Tabloid" },
  Instagram: { w: 1080, h: 1080, label: "Instagram" },
  Twitter: { w: 1200, h: 675, label: "Twitter" },
  FHD: { w: 1920, h: 1080, label: "Full HD" },
};

interface PaperSetupProps {
  onStart: (paper: PaperKey, orientation: Orientation) => void;
}

export default function PaperSetup({ onStart }: PaperSetupProps) {
  const [paper, setPaper] = useState<PaperKey>("A4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  const baseSize = SIZES[paper];
  const width = orientation === "portrait" ? baseSize.w : baseSize.h;
  const height = orientation === "portrait" ? baseSize.h : baseSize.w;
  const ratio = width / height;

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-xl grid md:grid-cols-2 overflow-hidden">
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
                {width} x {height}
              </span>
            </div>
          </div>
          <p className="absolute bottom-6 text-xs text-gray-500 font-medium uppercase tracking-widest">
            Preview
          </p>
        </div>
        <div className="flex flex-col h-full border-l bg-white">
          <CardHeader className="mb-4">
            <CardTitle>New Design</CardTitle>
            <CardDescription>
              Configure your canvas settings to get started.
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
                  {Object.entries(SIZES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
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
          <CardFooter className="border-t p-6 bg-gray-50/50 pb-0 flex-col gap-2">
            <Button
              className="w-full"
              size="lg"
              onClick={() => onStart(paper, orientation)}
            >
              Create Canvas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              className="w-full"
              size="lg"
              variant={"ghost"}
              onClick={() => onStart(paper, orientation)}
            >
              Select from Templates <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
