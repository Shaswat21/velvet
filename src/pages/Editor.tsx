import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { CanvasObject } from "@/lib/types";
import type { PaperKey, Orientation } from "@/lib/constants";
import DesignBoard from "@/components/design-board";

interface EditorState {
  paper: PaperKey;
  orientation: Orientation;
  objects: CanvasObject[];
  bgColor: string;
  name?: string;
  category?: string;
}

export default function EditorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Try to get state from Router (Navigation)
  const routerState = location.state as EditorState | null;

  // 2. Local State to hold the final config (either from Router or LocalStorage)
  const [config, setConfig] = useState<EditorState | null>(routerState);

  useEffect(() => {
    // If we have router state, we are good (already set in initial state)
    if (routerState) return;

    // If NO router state (e.g. Reload), try to load from Auto-Save
    // const savedData = localStorage.getItem("velvet_autosave");
    // if (savedData) {
    //   try {
    //     const parsed = JSON.parse(savedData);
    //     // Basic validation to ensure it's not junk data
    //     if (parsed && parsed.paper && parsed.objects) {
    //       setConfig(parsed);
    //       return;
    //     }
    //   } catch (e) {
    //     console.error("Failed to load autosave:", e);
    //   }
    // }

    // If neither exists, THEN redirect (prevents infinite loop)
    // We use replace: true to clean up history
    navigate("/", { replace: true });
  }, [routerState, navigate]);

  // If we are still determining config, or redirecting, show nothing or a loader
  if (!config) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <DesignBoard
      paper={config.paper}
      orientation={config.orientation}
      initialObjects={config.objects}
      initialBgColor={config.bgColor}
      //   initialName={config.name}
      //   initialCategory={config.category}
      onBack={() => navigate("/")}
    />
  );
}
