import { useState } from "react";
import PaperSetup from "@/components/layout/PaperSetup"; // We will create this next  
import DesignBoard from "@/components/design-board";

// Types shared between components
export type PaperKey = "A5" | "A4" | "A3" | "A2" | "Letter" | "Tabloid" | "Instagram" | "Twitter" | "FHD";
export type Orientation = "portrait" | "landscape";

export default function Home() {
  const [config, setConfig] = useState<{ paper: PaperKey; orientation: Orientation } | null>(null);

  return (
    <div className="flex-1 h-full w-full relative bg-gray-50">
      {/* 1. If no config, show Setup Screen */}
      {!config && (
        <PaperSetup 
          onStart={(paper, orientation) => setConfig({ paper, orientation })} 
        />
      )}

      {/* 2. If config exists, show Design Board */}
      {config && (
        <DesignBoard 
          paper={config.paper} 
          orientation={config.orientation} 
          onBack={() => setConfig(null)} 
        />
      )}
    </div>
  );
}