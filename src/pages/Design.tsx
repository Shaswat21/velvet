import { useState } from "react";
import DesignBoard from "@/components/layout/DesignBoard";
import PaperSetup from "@/components/layout/PaperSetup";

// Types shared between components
export type PaperKey = "A5" | "A4" | "A3" | "A2" | "Letter" | "Tabloid" | "Instagram" | "Twitter" | "FHD";
export type Orientation = "portrait" | "landscape";

export default function Design() {
  const [config, setConfig] = useState<{ paper: PaperKey; orientation: Orientation } | null>(null);

  // If no config is set, show the Setup Screen
  if (!config) {
    return <PaperSetup onStart={(paper, orientation) => setConfig({ paper, orientation })} />;
  }

  // Otherwise, show the Board
  return (
    <DesignBoard 
      paper={config.paper} 
      orientation={config.orientation} 
      onBack={() => setConfig(null)} 
    />
  );
}