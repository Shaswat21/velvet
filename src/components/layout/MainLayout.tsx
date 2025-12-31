import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

export default function MainLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      {/* Remove padding, make full flex */}
      <main className="flex-1 flex overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
