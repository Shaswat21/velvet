import { useNavigate } from "react-router-dom";
import PaperSetup, {
  type ImportedDesignData,
} from "@/components/layout/PaperSetup";
import type { PaperKey, Orientation } from "@/lib/constants";

export default function Home() {
  const navigate = useNavigate();

  // 1. Handle Start Fresh -> Go to Editor
  const handleStart = (paper: PaperKey, orientation: Orientation) => {
    navigate("/editor", {
      state: { paper, orientation, objects: [], bgColor: "#ffffff" },
    });
  };

  // 2. Handle File Import -> Go to Editor with data
  const handleImport = (data: ImportedDesignData) => {
    navigate("/editor", {
      state: {
        paper: data.paper,
        orientation: data.orientation,
        objects: data.objects,
        bgColor: data.bgColor,
      },
    });
  };

  return (
    <div className="flex-1 h-full w-full relative bg-gray-50">
      <PaperSetup
        onStart={handleStart}
        onImport={handleImport}
        onTemplates={() => navigate("/templates")} // Navigate to new route
      />
    </div>
  );
}
