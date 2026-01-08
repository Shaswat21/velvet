import { useState } from "react";
import PaperSetup, {
  type ImportedDesignData,
} from "@/components/layout/PaperSetup";
import DesignBoard from "@/components/design-board";
import type { CanvasObject } from "@/lib/types";

export type PaperKey =
  | "A5"
  | "A4"
  | "A3"
  | "A2"
  | "Letter"
  | "Tabloid"
  | "Instagram"
  | "Twitter"
  | "FHD";
export type Orientation = "portrait" | "landscape";

interface ConfigState {
  paper: PaperKey;
  orientation: Orientation;
  objects?: CanvasObject[];
  bgColor?: string;
}

export default function Home() {
  const [config, setConfig] = useState<ConfigState | null>(null);

  const handleImport = (data: ImportedDesignData) => {
    setConfig({
      paper: data.paper,
      orientation: data.orientation,
      objects: data.objects,
      bgColor: data.bgColor,
    });
  };

  return (
    <div className="flex-1 h-full w-full relative bg-gray-50">
      {!config && (
        <PaperSetup
          onStart={(paper, orientation) => setConfig({ paper, orientation })}
          onImport={handleImport}
        />
      )}

      {config && (
        <DesignBoard
          paper={config.paper}
          orientation={config.orientation}
          initialObjects={config.objects}
          initialBgColor={config.bgColor}
          onBack={() => setConfig(null)}
        />
      )}
    </div>
  );
}
