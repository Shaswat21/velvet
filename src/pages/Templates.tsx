import { useNavigate } from "react-router-dom";
import TemplatesGallery from "@/components/layout/TemplatesGallery";
import type { Template } from "@/lib/templates";

export default function TemplatesPage() {
  const navigate = useNavigate();

  const handleTemplateSelect = (template: Template) => {
    // Navigate to Editor with template data
    navigate("/editor", {
      state: {
        paper: template.paper,
        orientation: template.orientation,
        objects: template.objects,
        bgColor: template.bgColor,
      },
    });
  };

  return (
    <TemplatesGallery
      onSelect={handleTemplateSelect}
      onBack={() => navigate("/")} // Go back to Home
    />
  );
}
