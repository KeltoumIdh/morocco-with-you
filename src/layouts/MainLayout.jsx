import { useState } from "react";
import BottomNav from "../components/BottomNav";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import MobileDrawer from "../components/MobileDrawer";

function MainLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#f8fafc" }}
    >
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Sidebar collapsed={collapsed} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onMenu={() => setDrawerOpen(true)}
          onCollapse={() => setCollapsed((v) => !v)}
          collapsed={collapsed}
        />

        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl pb-20 lg:pb-0">{children}</div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

export default MainLayout;

