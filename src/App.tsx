import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { Toaster } from "./components/ui/sonner";
import Editor from "./pages/Editor";
import Templates from "./pages/Templates";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}

export default App;
